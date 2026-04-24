import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, CORE_TABLE_NAME, coreGsi } from '../../shared/core-db';
import { getAuthClaims } from '../../shared/auth';
import { ok, serverError } from '../../shared/response';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);
    const result = await ddb.send(new QueryCommand({
      TableName: CORE_TABLE_NAME,
      IndexName: 'GSI2',
      KeyConditionExpression: 'gsi2pk = :pk AND begins_with(gsi2sk, :prefix)',
      ExpressionAttributeValues: { ':pk': coreGsi.caregiverPk(sub), ':prefix': 'SPACE#' },
    }));
    return ok(result.Items ?? []);
  } catch (err) {
    return serverError(err);
  }
}
