import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, CORE_TABLE_NAME, coreKeys } from './core-db';

export interface AuthClaims {
  sub: string;
  email: string;
  groups: string[];
}

export function getAuthClaims(
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): AuthClaims {
  const claims = event.requestContext.authorizer.jwt.claims;
  const groupsValue = String(claims['cognito:groups'] ?? '');
  return {
    sub: String(claims['sub']),
    email: String(claims['email'] ?? ''),
    groups: groupsValue ? groupsValue.split(',').map((group) => group.trim()).filter(Boolean) : [],
  };
}

export const APP_ROLES = ['owner', 'caregiver'] as const;

export type AppRole = (typeof APP_ROLES)[number];

export function normalizeRoles(roles: unknown): AppRole[] {
  const values = typeof roles === 'string' ? [roles] : Array.isArray(roles) ? roles : [];
  const normalized = values.flatMap((role) => {
    const value = String(role);
    if (value === 'both') return ['owner', 'caregiver'] satisfies AppRole[];
    return value === 'owner' || value === 'caregiver' ? [value] : [];
  });

  return Array.from(new Set(normalized));
}

function isOwnerProfileActive(value: unknown) {
  if (value === false || value === 'false' || value === 0 || value === '0') {
    return false;
  }

  return true;
}

export function resolveProfileRoles(
  item: Record<string, unknown>,
  fallbackRoles: AppRole[] = ['owner'],
): AppRole[] {
  const legacyRole = typeof item.role === 'string' ? [item.role] : [];
  const rawRoles = normalizeRoles(item.roles ?? legacyRole);
  const effectiveRoles = isOwnerProfileActive(item.owner_profile_active)
    ? rawRoles
    : rawRoles.filter((role) => role !== 'owner');

  if (effectiveRoles.length) {
    return effectiveRoles;
  }

  return item.signup_intent === 'caregiver' ? [] : fallbackRoles;
}

export function deriveRolesFromGroups(groups: string[]): AppRole[] {
  const mapped = groups.flatMap((group) => {
    if (group === 'owner' || group === 'caregiver') return [group];
    if (group === 'both') return ['owner', 'caregiver'];
    return [];
  });

  return Array.from(new Set(mapped));
}

export async function userHasRole(sub: string, role: AppRole): Promise<boolean> {
  const result = await ddb.send(new GetCommand({
    TableName: CORE_TABLE_NAME,
    Key: coreKeys.userProfile(sub),
  }));

  const profileRoles = result.Item
    ? resolveProfileRoles(result.Item as Record<string, unknown>)
    : [];
  return profileRoles.includes(role);
}
