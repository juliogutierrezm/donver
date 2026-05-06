import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, BOOKINGS_TABLE_NAME, bookingsGsi } from '../../shared/bookings-db';
import { CORE_TABLE_NAME, coreKeys } from '../../shared/core-db';
import { getAuthClaims, userHasRole } from '../../shared/auth';
import { forbidden, ok, serverError } from '../../shared/response';

async function safeGetItem(key: Record<string, string>) {
  try {
    const result = await ddb.send(new GetCommand({
      TableName: CORE_TABLE_NAME,
      Key: key,
    }));
    return result.Item as Record<string, unknown> | undefined;
  } catch (error) {
    console.warn('Optional owner booking enrichment failed', { key, error });
    return undefined;
  }
}

function toUserName(item: Record<string, unknown> | undefined) {
  const fullName =
    typeof item?.['full_name'] === 'string' && item['full_name'].trim()
      ? item['full_name']
      : typeof item?.['fullName'] === 'string' && item['fullName'].trim()
        ? item['fullName']
        : undefined;
  const name =
    typeof item?.['name'] === 'string' && item['name'].trim()
      ? item['name']
      : fullName;
  const email =
    typeof item?.['email'] === 'string' && item['email'].trim()
      ? item['email']
      : undefined;

  return {
    name: name ?? email ?? 'Usuario Donver',
  };
}

function toSpaceSummary(item: Record<string, unknown> | undefined) {
  const name =
    typeof item?.['name'] === 'string' && item['name'].trim()
      ? item['name']
      : typeof item?.['title'] === 'string' && item['title'].trim()
        ? item['title']
        : undefined;
  const caregiverId =
    typeof item?.['caregiver_id'] === 'string' && item['caregiver_id'].trim()
      ? item['caregiver_id']
      : '';

  return {
    name: name ?? 'Espacio Donver',
    caregiverId,
  };
}

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);
    if (!(await userHasRole(sub, 'owner'))) {
      return forbidden('No tienes perfil de dueño activo.');
    }
    const result = await ddb.send(new QueryCommand({
      TableName: BOOKINGS_TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'gsi1pk = :pk AND begins_with(gsi1sk, :prefix)',
      ExpressionAttributeValues: { ':pk': bookingsGsi.ownerPk(sub), ':prefix': 'BOOKING#' },
    }));
    const bookings = (result.Items ?? []) as Record<string, unknown>[];

    const enriched = await Promise.all(
      bookings.map(async (booking) => {
        const spaceId = String(booking['space_id'] ?? '');
        const space = spaceId ? await safeGetItem(coreKeys.space(spaceId)) : undefined;
        const spaceSummary = toSpaceSummary(space);

        const caregiver = spaceSummary.caregiverId
          ? await safeGetItem(coreKeys.userProfile(spaceSummary.caregiverId))
          : undefined;
        const caregiverSummary = toUserName(caregiver);

        return {
          ...booking,
          space_name: spaceSummary.name,
          caregiver_name: caregiverSummary.name,
        };
      })
    );

    return ok(enriched);
  } catch (err) {
    return serverError(err);
  }
}
