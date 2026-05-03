import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, CORE_TABLE_NAME, coreKeys } from '../../shared/core-db';
import { BOOKINGS_TABLE_NAME, bookingKeys } from '../../shared/bookings-db';
import { ok, notFound, serverError } from '../../shared/response';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const id = event.pathParameters?.['id'];
    if (!id) return notFound('Space not found');

    const [spaceResult, blockedResult] = await Promise.all([
      ddb.send(new GetCommand({
        TableName: CORE_TABLE_NAME,
        Key: coreKeys.space(id),
      })),
      ddb.send(new QueryCommand({
        TableName: BOOKINGS_TABLE_NAME,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
        ExpressionAttributeValues: { ':pk': bookingKeys.spacePk(id), ':prefix': bookingKeys.blockedPrefix },
      })),
    ]);

    if (!spaceResult.Item || spaceResult.Item['is_active'] !== true) return notFound('Space not found');
    return ok({ space: spaceResult.Item, blockedDates: blockedResult.Items ?? [] });
  } catch (err) {
    return serverError(err);
  }
}
