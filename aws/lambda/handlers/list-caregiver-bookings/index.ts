import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, BOOKINGS_TABLE_NAME, bookingsGsi } from '../../shared/bookings-db';
import { getAuthClaims, userHasRole } from '../../shared/auth';
import { forbidden, ok, serverError } from '../../shared/response';

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
    return ok(result.Items ?? []);
  } catch (err) {
    return serverError(err);
  }
}
