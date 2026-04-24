import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, BOOKINGS_TABLE_NAME, bookingsGsi } from '../../shared/bookings-db';
import { getAuthClaims } from '../../shared/auth';
import { ok, serverError } from '../../shared/response';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);
    const result = await ddb.send(new QueryCommand({
      TableName: BOOKINGS_TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'gsi1pk = :pk AND begins_with(gsi1sk, :prefix)',
      ExpressionAttributeValues: { ':pk': bookingsGsi.ownerPk(sub), ':prefix': 'BOOKING#' },
    }));
    return ok(result.Items ?? []);
  } catch (err) {
    return serverError(err);
  }
}
