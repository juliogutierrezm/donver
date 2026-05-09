import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, CORE_TABLE_NAME, coreKeys } from '../../shared/core-db';
import { getAuthClaims, resolveProfileRoles } from '../../shared/auth';
import { normalizeProfileWithStatus } from '../../shared/profile';
import { badRequest, notFound, ok, serverError } from '../../shared/response';

interface ActivateOwnerBody {
  name?: string;
  phone?: string;
  province?: string;
  canton?: string;
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);
    const body = JSON.parse(event.body ?? '{}') as ActivateOwnerBody;

    const existing = await ddb.send(new GetCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.userProfile(sub),
    }));

    if (!existing.Item) {
      return notFound('Perfil no encontrado.');
    }

    const currentItem = existing.Item as Record<string, unknown>;
    const currentRoles = resolveProfileRoles(currentItem);
    const hasOwnerRole = currentRoles.includes('owner');
    const isCaregiverOnly = currentRoles.includes('caregiver') && !hasOwnerRole;

    if (!isCaregiverOnly) {
      return ok(await normalizeProfileWithStatus(currentItem, currentRoles.length ? currentRoles : ['owner']));
    }

    const nextName = readString(body.name) || readString(currentItem['name']);
    const nextPhone = readString(body.phone) || readString(currentItem['phone']);
    const nextProvince = readString(body.province) || readString(currentItem['province']);
    const nextCanton = readString(body.canton) || readString(currentItem['canton']);

    if (!nextName || !nextPhone || !nextProvince || !nextCanton) {
      return badRequest('Completa tu nombre, teléfono, provincia y cantón para activar tu perfil de dueño.');
    }

    const now = new Date().toISOString();
    const nextRoles = ['owner', 'caregiver'];
    const result = await ddb.send(new UpdateCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.userProfile(sub),
      UpdateExpression: 'SET #name = :name, phone = :phone, province = :province, canton = :canton, #roles = :roles, active_role = :activeRole, owner_profile_active = :ownerProfileActive, signup_intent = :signupIntent, updated_at = :now',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#roles': 'roles',
      },
      ExpressionAttributeValues: {
        ':name': nextName,
        ':phone': nextPhone,
        ':province': nextProvince,
        ':canton': nextCanton,
        ':roles': nextRoles,
        ':activeRole': 'owner',
        ':ownerProfileActive': true,
        ':signupIntent': null,
        ':now': now,
      },
      ReturnValues: 'ALL_NEW',
    }));

    return ok(await normalizeProfileWithStatus((result.Attributes ?? {}) as Record<string, unknown>, nextRoles));
  } catch (err) {
    return serverError(err);
  }
}
