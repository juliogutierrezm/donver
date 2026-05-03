import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { getAuthClaims, normalizeRoles } from '../../shared/auth';
import { CORE_TABLE_NAME, coreKeys, ddb } from '../../shared/core-db';
import { normalizeProfileWithStatus } from '../../shared/profile';
import { badRequest, conflict, notFound, ok, serverError } from '../../shared/response';

interface OnboardingBody {
  name?: string;
  phone?: string;
  province?: string;
  canton?: string;
  bio?: string;
}

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);
    const body = JSON.parse(event.body ?? '{}') as OnboardingBody;
    const name = body.name?.trim();
    const phone = body.phone?.trim();
    const province = body.province?.trim();
    const canton = body.canton?.trim();
    const bio = body.bio?.trim();

    if (!name || !phone || !province || !canton || !bio) {
      return badRequest('name, phone, province, canton and bio are required');
    }

    const existing = await ddb.send(new GetCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.userProfile(sub),
    }));

    if (!existing.Item) {
      return notFound('Profile not found');
    }

    const currentRoles = normalizeRoles(existing.Item['roles'] ?? existing.Item['role']);
    if (currentRoles.includes('caregiver')) {
      return conflict('Caregiver profile already exists');
    }

    const nextRoles = Array.from(new Set([...currentRoles, 'owner', 'caregiver']));
    const now = new Date().toISOString();
    const result = await ddb.send(new UpdateCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.userProfile(sub),
      UpdateExpression: 'SET #name = :name, phone = :phone, province = :province, canton = :canton, bio = :bio, #roles = :roles, active_role = :activeRole, signup_intent = :signupIntent, updated_at = :now',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#roles': 'roles',
      },
      ExpressionAttributeValues: {
        ':name': name,
        ':phone': phone,
        ':province': province,
        ':canton': canton,
        ':bio': bio,
        ':roles': nextRoles,
        ':activeRole': 'caregiver',
        ':signupIntent': null,
        ':now': now,
      },
      ReturnValues: 'ALL_NEW',
    }));

    return ok(await normalizeProfileWithStatus((result.Attributes ?? {}) as Record<string, unknown>));
  } catch (err) {
    return serverError(err);
  }
}
