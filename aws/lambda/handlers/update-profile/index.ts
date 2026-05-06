import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, CORE_TABLE_NAME, coreKeys } from '../../shared/core-db';
import { getAuthClaims, resolveProfileRoles } from '../../shared/auth';
import { normalizeProfileWithStatus } from '../../shared/profile';
import { badRequest, notFound, ok, serverError } from '../../shared/response';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);
    const body = JSON.parse(event.body ?? '{}') as {
      name?: string; bio?: string; phone?: string; avatar_url?: string; province?: string; canton?: string; active_role?: string;
    };
    const now = new Date().toISOString();
    const existing = await ddb.send(new GetCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.userProfile(sub),
    }));
    if (!existing.Item) return notFound('Profile not found');

    const currentRoles = resolveProfileRoles(existing.Item as Record<string, unknown>);
    if (body.active_role !== undefined && !currentRoles.includes(body.active_role as typeof currentRoles[number])) {
      return badRequest('active_role must belong to the current user roles');
    }

    const exprParts: string[] = ['updated_at = :now'];
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = { ':now': now };

    if (body.name !== undefined) { exprParts.push('#name = :name'); names['#name'] = 'name'; values[':name'] = body.name; }
    if (body.bio !== undefined)  { exprParts.push('bio = :bio');   values[':bio']  = body.bio; }
    if (body.phone !== undefined) { exprParts.push('phone = :phone'); values[':phone'] = body.phone; }
    if (body.avatar_url !== undefined) { exprParts.push('avatar_url = :avatar_url'); values[':avatar_url'] = body.avatar_url; }
    if (body.province !== undefined) { exprParts.push('province = :province'); values[':province'] = body.province; }
    if (body.canton !== undefined) { exprParts.push('canton = :canton'); values[':canton'] = body.canton; }
    if (body.active_role !== undefined) { exprParts.push('active_role = :active_role'); values[':active_role'] = body.active_role; }

    const result = await ddb.send(new UpdateCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.userProfile(sub),
      UpdateExpression: `SET ${exprParts.join(', ')}`,
      ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    }));
    return ok(await normalizeProfileWithStatus((result.Attributes ?? {}) as Record<string, unknown>, currentRoles.length ? currentRoles : ['owner']));
  } catch (err) {
    return serverError(err);
  }
}
