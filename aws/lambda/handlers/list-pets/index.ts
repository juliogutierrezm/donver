import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, CORE_TABLE_NAME, coreGsi } from '../../shared/core-db';
import { getAuthClaims, userHasRole } from '../../shared/auth';
import { forbidden, ok, serverError } from '../../shared/response';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);
    if (!(await userHasRole(sub, 'owner'))) {
      return forbidden('No tienes perfil de dueño activo.');
    }
    const result = await ddb.send(new QueryCommand({
      TableName: CORE_TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'gsi1pk = :pk AND begins_with(gsi1sk, :prefix)',
      ExpressionAttributeValues: { ':pk': coreGsi.ownerPk(sub), ':prefix': 'PET#' },
    }));
    return ok(result.Items ?? []);
  } catch (err) {
    return serverError(err);
  }
}
