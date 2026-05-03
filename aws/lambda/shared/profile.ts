import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { APP_ROLES, type AppRole, normalizeRoles } from './auth';
import { ddb, CORE_TABLE_NAME, coreGsi } from './core-db';

export type SignupIntent = 'caregiver';

export interface CaregiverStatus {
  profile_complete: boolean;
  operational_ready: boolean;
  missing_profile_fields: string[];
  has_publishable_space: boolean;
}

export interface ProfileRecord extends Record<string, unknown> {
  roles: AppRole[];
  active_role: AppRole;
  signup_intent: SignupIntent | null;
  caregiver_status?: CaregiverStatus;
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function hasNonEmptyString(value: unknown) {
  return readString(value).length > 0;
}

function asFiniteNumber(value: unknown) {
  return typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim()
      ? Number(value)
      : Number.NaN;
}

function normalizeSignupIntent(value: unknown): SignupIntent | null {
  return value === 'caregiver' ? 'caregiver' : null;
}

export function normalizeProfileRecord(
  item: Record<string, unknown>,
  fallbackRoles: AppRole[] = ['owner'],
): ProfileRecord {
  const legacyRole = typeof item.role === 'string' ? [item.role] : [];
  const roles = normalizeRoles(item.roles ?? legacyRole);
  const nextRoles = roles.length ? roles : fallbackRoles;
  const requestedActiveRole = readString(item.active_role);
  const activeRole = APP_ROLES.includes(requestedActiveRole as AppRole) &&
    nextRoles.includes(requestedActiveRole as AppRole)
    ? (requestedActiveRole as AppRole)
    : (nextRoles[0] ?? 'owner');

  return {
    ...item,
    roles: nextRoles,
    active_role: activeRole,
    signup_intent: normalizeSignupIntent(item.signup_intent),
  };
}

export function getMissingCaregiverFields(profile: Record<string, unknown>) {
  const requiredFields: Array<[string, unknown]> = [
    ['name', profile.name],
    ['phone', profile.phone],
    ['province', profile.province],
    ['canton', profile.canton],
    ['bio', profile.bio],
  ];

  return requiredFields
    .filter(([, value]) => !hasNonEmptyString(value))
    .map(([field]) => field);
}

export function isSpacePublishReady(space: Record<string, unknown>) {
  const title = readString(space.name ?? space.title);
  const description = readString(space.description);
  const province = readString(space.province);
  const canton = readString(space.canton);
  const address = readString(space.address);
  const latitude = asFiniteNumber(space.latitude);
  const longitude = asFiniteNumber(space.longitude);
  const pricePerNight = asFiniteNumber(space.price_per_night);
  const pricePerHour = asFiniteNumber(space.price_per_hour);
  const minHours = asFiniteNumber(space.min_hours);
  const acceptedPetTypes = Array.isArray(space.accepted_pet_types) ? space.accepted_pet_types : [];
  const photos = Array.isArray(space.photos) ? space.photos : [];

  return (
    title.length > 0 &&
    description.length > 0 &&
    province.length > 0 &&
    canton.length > 0 &&
    address.length > 0 &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    pricePerNight > 0 &&
    pricePerHour > 0 &&
    minHours >= 1 &&
    acceptedPetTypes.length > 0 &&
    photos.length > 0
  );
}

export async function listCaregiverSpaces(sub: string) {
  if (!sub) return [];

  const result = await ddb.send(new QueryCommand({
    TableName: CORE_TABLE_NAME,
    IndexName: 'GSI2',
    KeyConditionExpression: 'gsi2pk = :pk AND begins_with(gsi2sk, :prefix)',
    ExpressionAttributeValues: {
      ':pk': coreGsi.caregiverPk(sub),
      ':prefix': 'SPACE#',
    },
  }));

  return (result.Items ?? []) as Record<string, unknown>[];
}

export function buildCaregiverStatus(
  profile: Record<string, unknown>,
  spaces: Record<string, unknown>[] = [],
): CaregiverStatus {
  const missingFields = getMissingCaregiverFields(profile);
  const profileComplete = missingFields.length === 0;
  const hasPublishableSpace = spaces.some((space) => isSpacePublishReady(space));

  return {
    profile_complete: profileComplete,
    operational_ready: profileComplete && hasPublishableSpace,
    missing_profile_fields: missingFields,
    has_publishable_space: hasPublishableSpace,
  };
}

export async function normalizeProfileWithStatus(
  item: Record<string, unknown>,
  fallbackRoles: AppRole[] = ['owner'],
) {
  const profile = normalizeProfileRecord(item, fallbackRoles);
  const spaces = profile.roles.includes('caregiver')
    ? await listCaregiverSpaces(String(profile.sub ?? ''))
    : [];

  return {
    ...profile,
    caregiver_status: buildCaregiverStatus(profile, spaces),
  } satisfies ProfileRecord;
}
