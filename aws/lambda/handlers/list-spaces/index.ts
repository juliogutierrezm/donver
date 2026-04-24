import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, CORE_TABLE_NAME, coreGsi } from '../../shared/core-db';
import { ok, serverError } from '../../shared/response';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const qs = event.queryStringParameters ?? {};
    const result = await ddb.send(new QueryCommand({
      TableName: CORE_TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'gsi1pk = :pk',
      ExpressionAttributeValues: { ':pk': coreGsi.allSpacesPk },
    }));

    let spaces = (result.Items ?? []).filter((s) => s['is_active'] === true);

    if (qs['province']) spaces = spaces.filter((s) => s['province'] === qs['province']);
    if (qs['canton'])   spaces = spaces.filter((s) => s['canton'] === qs['canton']);
    if (qs['petType'])  spaces = spaces.filter((s) => Array.isArray(s['accepted_pet_types']) && s['accepted_pet_types'].includes(qs['petType']));

    return ok(spaces);
  } catch (err) {
    return serverError(err);
  }
}
