import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, CORE_TABLE_NAME, coreKeys } from '../../shared/core-db';
import { BOOKINGS_TABLE_NAME, bookingKeys } from '../../shared/bookings-db';
import { getAuthClaims } from '../../shared/auth';
import { created, badRequest, forbidden, notFound, serverError } from '../../shared/response';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);
    const spaceId = event.pathParameters?.['id'];
    if (!spaceId) return notFound('Space not found');

    const body = JSON.parse(event.body ?? '{}') as { date?: string; reason?: string };
    if (!body.date) return badRequest('date required');

    const spaceResult = await ddb.send(new GetCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.space(spaceId),
    }));
    if (!spaceResult.Item) return notFound('Space not found');
    if (spaceResult.Item['caregiver_id'] !== sub) return forbidden();

    const item = {
      pk: `SPACE#${spaceId}`,
      sk: bookingKeys.blockedSk(body.date),
      id: body.date,
      date: body.date,
      reason: body.reason ?? '',
    };
    await ddb.send(new PutCommand({ TableName: BOOKINGS_TABLE_NAME, Item: item }));
    return created(item);
  } catch (err) {
    return serverError(err);
  }
}
