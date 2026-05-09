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
    console.warn('Optional caregiver booking enrichment failed', { key, error });
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
    email,
  };
}

function toSpaceName(item: Record<string, unknown> | undefined) {
  const name =
    typeof item?.['name'] === 'string' && item['name'].trim()
      ? item['name']
      : typeof item?.['title'] === 'string' && item['title'].trim()
        ? item['title']
        : undefined;
  return name ?? 'Espacio Donver';
}

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);
    if (!(await userHasRole(sub, 'caregiver'))) {
      return forbidden('Caregiver role required');
    }

    const result = await ddb.send(new QueryCommand({
      TableName: BOOKINGS_TABLE_NAME,
      IndexName: 'GSI2',
      KeyConditionExpression: 'gsi2pk = :pk AND begins_with(gsi2sk, :prefix)',
      ExpressionAttributeValues: { ':pk': bookingsGsi.caregiverPk(sub), ':prefix': 'BOOKING#' },
    }));
    const bookings = (result.Items ?? []) as Record<string, unknown>[];

    const enriched = await Promise.all(
      bookings.map(async (booking) => {
        const ownerId = String(booking['owner_id'] ?? '');
        const spaceId = String(booking['space_id'] ?? '');

        const [owner, space] = await Promise.all([
          ownerId ? safeGetItem(coreKeys.userProfile(ownerId)) : Promise.resolve(undefined),
          spaceId ? safeGetItem(coreKeys.space(spaceId)) : Promise.resolve(undefined),
        ]);

        const ownerSummary = toUserName(owner);
        const spaceName = toSpaceName(space);

        return {
          ...booking,
          owner_name: ownerSummary.name,
          owner_email: ownerSummary.email,
          space_name: spaceName,
        };
      })
    );

    return ok(enriched);
  } catch (err) {
    return serverError(err);
  }
}
