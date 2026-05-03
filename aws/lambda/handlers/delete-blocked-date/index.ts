import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, CORE_TABLE_NAME, coreKeys } from '../../shared/core-db';
import { BOOKINGS_TABLE_NAME, bookingKeys } from '../../shared/bookings-db';
import { getAuthClaims, userHasRole } from '../../shared/auth';
import { noContent, forbidden, notFound, serverError } from '../../shared/response';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);
    if (!(await userHasRole(sub, 'caregiver'))) {
      return forbidden('Caregiver role required');
    }

    const spaceId = event.pathParameters?.['id'];
    const blockedDateId = event.pathParameters?.['blockedDateId'];
    if (!spaceId || !blockedDateId) return notFound('Not found');

    const spaceResult = await ddb.send(new GetCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.space(spaceId),
    }));
    if (!spaceResult.Item) return notFound('Space not found');
    if (spaceResult.Item['caregiver_id'] !== sub) return forbidden();

    await ddb.send(new DeleteCommand({
      TableName: BOOKINGS_TABLE_NAME,
      Key: { pk: bookingKeys.spacePk(spaceId), sk: bookingKeys.blockedSk(blockedDateId) },
    }));
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
