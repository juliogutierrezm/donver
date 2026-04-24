import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, CORE_TABLE_NAME, coreKeys } from '../../shared/core-db';
import { getAuthClaims } from '../../shared/auth';
import { ok, serverError } from '../../shared/response';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);
    const body = JSON.parse(event.body ?? '{}') as {
      name?: string; bio?: string; phone?: string; avatar_url?: string; role?: string;
    };
    const now = new Date().toISOString();

    const exprParts: string[] = ['updated_at = :now'];
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = { ':now': now };

    if (body.name !== undefined) { exprParts.push('#name = :name'); names['#name'] = 'name'; values[':name'] = body.name; }
    if (body.bio !== undefined)  { exprParts.push('bio = :bio');   values[':bio']  = body.bio; }
    if (body.phone !== undefined) { exprParts.push('phone = :phone'); values[':phone'] = body.phone; }
    if (body.avatar_url !== undefined) { exprParts.push('avatar_url = :avatar_url'); values[':avatar_url'] = body.avatar_url; }
    if (body.role !== undefined) { exprParts.push('#role = :role'); names['#role'] = 'role'; values[':role'] = body.role; }

    const result = await ddb.send(new UpdateCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.userProfile(sub),
      UpdateExpression: `SET ${exprParts.join(', ')}`,
      ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    }));
    return ok(result.Attributes);
  } catch (err) {
    return serverError(err);
  }
}
