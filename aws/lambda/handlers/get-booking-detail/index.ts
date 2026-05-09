import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, BOOKINGS_TABLE_NAME, bookingKeys } from '../../shared/bookings-db';
import { CORE_TABLE_NAME, coreKeys } from '../../shared/core-db';
import { getAuthClaims } from '../../shared/auth';
import { forbidden, notFound, ok, serverError } from '../../shared/response';

async function safeGetItem(key: Record<string, string>, tableName: string) {
  try {
    const result = await ddb.send(new GetCommand({
      TableName: tableName,
      Key: key,
    }));
    return result.Item as Record<string, unknown> | undefined;
  } catch (error) {
    console.warn('Optional booking detail lookup failed', { tableName, key, error });
    return undefined;
  }
}

function toPartySummary(item: Record<string, unknown> | undefined, userId: string) {
  if (!userId) return undefined;
  const fullName =
    typeof item?.['full_name'] === 'string' && item['full_name'].trim()
      ? item['full_name']
      : typeof item?.['fullName'] === 'string' && item['fullName'].trim()
        ? item['fullName']
        : undefined;
  const name =
    typeof item?.['name'] === 'string' && item['name'].trim()
      ? item['name']
      : fullName;
  const email =
    typeof item?.['email'] === 'string' && item['email'].trim()
      ? item['email']
      : undefined;
  const phone =
    typeof item?.['phone'] === 'string' && item['phone'].trim()
      ? item['phone']
      : undefined;
  const avatarUrl =
    typeof item?.['avatar_url'] === 'string' && item['avatar_url'].trim()
      ? item['avatar_url']
      : typeof item?.['avatarUrl'] === 'string' && item['avatarUrl'].trim()
        ? item['avatarUrl']
        : undefined;

  return {
    id: userId,
    name: name ?? email ?? 'Usuario Donver',
    email,
    phone,
    avatar_url: avatarUrl,
  };
}

function toSpaceSummary(item: Record<string, unknown> | undefined) {
  if (!item) return undefined;

  return {
    id: String(item['id'] ?? ''),
    name: typeof item['name'] === 'string' ? item['name'] : '',
    province: typeof item['province'] === 'string' ? item['province'] : undefined,
    canton: typeof item['canton'] === 'string' ? item['canton'] : undefined,
    address: typeof item['address'] === 'string' ? item['address'] : undefined,
    price_per_night: typeof item['price_per_night'] === 'number' ? item['price_per_night'] : 0,
    price_per_hour: typeof item['price_per_hour'] === 'number' ? item['price_per_hour'] : 0,
    additional_pet_rate:
      typeof item['additional_pet_rate'] === 'number' ? item['additional_pet_rate'] : undefined,
  };
}

function toPetSummary(item: Record<string, unknown> | undefined) {
  if (!item) return undefined;

  return {
    id: String(item['id'] ?? ''),
    name: typeof item['name'] === 'string' ? item['name'] : '',
    species: typeof item['species'] === 'string' ? item['species'] : 'other',
    breed: typeof item['breed'] === 'string' && item['breed'].trim() ? item['breed'] : undefined,
    size: typeof item['size'] === 'string' && item['size'].trim() ? item['size'] : undefined,
    age: typeof item['age'] === 'number' ? item['age'] : undefined,
    description: typeof item['description'] === 'string' && item['description'].trim() ? item['description'] : undefined,
    photos: Array.isArray(item['photos']) ? item['photos'].map(String) : [],
    medical_notes:
      typeof item['medical_notes'] === 'string' && item['medical_notes'].trim()
        ? item['medical_notes']
        : undefined,
  };
}

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);
    const id = event.pathParameters?.['id'];
    if (!id) return notFound('Booking not found');

    const result = await ddb.send(new GetCommand({
      TableName: BOOKINGS_TABLE_NAME,
      Key: bookingKeys.booking(id),
    }));
    if (!result.Item) return notFound('Booking not found');

    const booking = result.Item as Record<string, unknown>;
    if (booking['owner_id'] !== sub && booking['caregiver_id'] !== sub) {
      return forbidden();
    }

    const response: Record<string, unknown> = { ...booking };
    const spaceId = typeof booking['space_id'] === 'string' ? booking['space_id'] : '';
    const ownerId = typeof booking['owner_id'] === 'string' ? booking['owner_id'] : '';
    const caregiverId = typeof booking['caregiver_id'] === 'string' ? booking['caregiver_id'] : '';
    const petIds = Array.isArray(booking['pet_ids']) ? booking['pet_ids'].map(String) : [];

    const [spaceItem, ownerItem, caregiverItem, pets] = await Promise.all([
      spaceId ? safeGetItem(coreKeys.space(spaceId), CORE_TABLE_NAME) : Promise.resolve(undefined),
      ownerId ? safeGetItem(coreKeys.userProfile(ownerId), CORE_TABLE_NAME) : Promise.resolve(undefined),
      caregiverId ? safeGetItem(coreKeys.userProfile(caregiverId), CORE_TABLE_NAME) : Promise.resolve(undefined),
      Promise.all(
        petIds.map(async (petId) => {
          const petItem = await safeGetItem(coreKeys.pet(petId), CORE_TABLE_NAME);
          return toPetSummary(petItem);
        }),
      ),
    ]);

    const space = toSpaceSummary(spaceItem);
    if (space) response['space'] = space;

    const owner = toPartySummary(ownerItem, ownerId);
    if (owner) response['owner'] = owner;

    const caregiver = toPartySummary(caregiverItem, caregiverId);
    if (caregiver) response['caregiver'] = caregiver;

    const relatedPets = pets.filter(Boolean);
    if (relatedPets.length > 0) response['pets'] = relatedPets;

    return ok(response);
  } catch (err) {
    return serverError(err);
  }
}
