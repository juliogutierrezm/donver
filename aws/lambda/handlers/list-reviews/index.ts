import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, CORE_TABLE_NAME, coreKeys } from '../../shared/core-db';
import { ok, notFound, serverError } from '../../shared/response';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const id = event.pathParameters?.['id'];
    if (!id) return notFound('Space not found');

    const result = await ddb.send(new QueryCommand({
      TableName: CORE_TABLE_NAME,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: { ':pk': coreKeys.reviewPk(id), ':prefix': coreKeys.reviewPrefix },
    }));
    return ok(result.Items ?? []);
  } catch (err) {
    return serverError(err);
  }
}
