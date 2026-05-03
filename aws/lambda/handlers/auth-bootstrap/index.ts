import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, CORE_TABLE_NAME, coreKeys } from '../../shared/core-db';
import { deriveRolesFromGroups, getAuthClaims, normalizeRoles } from '../../shared/auth';
import { ok, serverError } from '../../shared/response';
import { normalizeProfileWithStatus } from '../../shared/profile';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub, email, groups } = getAuthClaims(event);
    const now = new Date().toISOString();
    const derivedRoles = deriveRolesFromGroups(groups);

    const existing = await ddb.send(new GetCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.userProfile(sub),
    }));

    if (!existing.Item) {
      const profile = {
        pk: `USER#${sub}`,
        sk: 'PROFILE',
        sub,
        email,
        name: email.split('@')[0],
        roles: derivedRoles.length ? derivedRoles : ['owner'],
        active_role: derivedRoles[0] ?? 'owner',
        bio: '',
        phone: '',
        avatar_url: '',
        province: '',
        canton: '',
        signup_intent: null,
        created_at: now,
        updated_at: now,
      };
      await ddb.send(new PutCommand({ TableName: CORE_TABLE_NAME, Item: profile }));
      return ok(await normalizeProfileWithStatus(profile, derivedRoles.length ? derivedRoles : ['owner']));
    }

    const item = existing.Item as Record<string, unknown>;
    const roles = normalizeRoles(item.roles ?? item.role ?? derivedRoles);
    const nextRoles = roles.length ? roles : (derivedRoles.length ? derivedRoles : ['owner']);
    const needsEmailUpdate = String(item.email ?? '') !== email;
    const needsRoleBackfill = !Array.isArray(item.roles) || item.roles.length === 0;

    if (!needsEmailUpdate && !needsRoleBackfill) {
      return ok(await normalizeProfileWithStatus(item, nextRoles));
    }

    const updated = await ddb.send(new UpdateCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.userProfile(sub),
      UpdateExpression: `SET #email = :email${needsRoleBackfill ? ', #roles = :roles, active_role = :activeRole' : ''}, updated_at = :now`,
      ExpressionAttributeNames: {
        '#email': 'email',
        ...(needsRoleBackfill ? { '#roles': 'roles' } : {}),
      },
      ExpressionAttributeValues: {
        ':email': email,
        ...(needsRoleBackfill
          ? {
              ':roles': nextRoles,
              ':activeRole': String(item.active_role ?? nextRoles[0] ?? 'owner'),
            }
          : {}),
        ':now': now,
      },
      ReturnValues: 'ALL_NEW',
    }));
    return ok(await normalizeProfileWithStatus((updated.Attributes ?? {}) as Record<string, unknown>, nextRoles));
  } catch (err) {
    return serverError(err);
  }
}
