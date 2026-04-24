import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, CORE_TABLE_NAME, coreKeys } from '../../shared/core-db';
import { getAuthClaims } from '../../shared/auth';
import { ok, forbidden, notFound, serverError } from '../../shared/response';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);
    const id = event.pathParameters?.['id'];
    if (!id) return notFound('Space not found');

    const existing = await ddb.send(new GetCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.space(id),
    }));
    if (!existing.Item) return notFound('Space not found');
    if (existing.Item['caregiver_id'] !== sub) return forbidden();

    const body = JSON.parse(event.body ?? '{}') as Record<string, unknown>;
    const now = new Date().toISOString();
    const allowed = ['name','description','province','canton','address','accepted_pet_types',
      'price_per_night','price_per_hour','max_pets','is_active','photos'];

    const exprParts: string[] = ['updated_at = :now'];
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = { ':now': now };

    for (const key of allowed) {
      if (body[key] !== undefined) {
        const safe = key === 'name' ? '#name' : `#${key}`;
        exprParts.push(`${safe} = :${key}`);
        names[safe] = key;
        values[`:${key}`] = body[key];
      }
    }

    const result = await ddb.send(new UpdateCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.space(id),
      UpdateExpression: `SET ${exprParts.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    }));
    return ok(result.Attributes);
  } catch (err) {
    return serverError(err);
  }
}
