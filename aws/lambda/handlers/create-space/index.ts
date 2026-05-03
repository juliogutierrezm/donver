import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, CORE_TABLE_NAME, coreGsi, coreKeys } from '../../shared/core-db';
import { getAuthClaims, userHasRole } from '../../shared/auth';
import { created, badRequest, forbidden, serverError } from '../../shared/response';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);
    if (!(await userHasRole(sub, 'caregiver'))) {
      return forbidden('Caregiver role required');
    }

    const body = JSON.parse(event.body ?? '{}') as {
      name?: string; description?: string; province?: string; canton?: string;
      address?: string; accepted_pet_types?: string[]; price_per_night?: number;
      price_per_hour?: number; max_pets?: number; latitude?: number; longitude?: number;
      min_hours?: number; accepted_pet_sizes?: string[]; amenities?: string[]; photos?: string[];
    };

    if (!body.name || !body.province || !body.canton) return badRequest('name, province, canton required');

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const space = {
      ...coreKeys.space(id),
      gsi1pk: coreGsi.allSpacesPk,
      gsi1sk: `SPACE#${id}`,
      gsi2pk: coreGsi.caregiverPk(sub),
      gsi2sk: `SPACE#${id}`,
      id,
      caregiver_id: sub,
      name: body.name,
      description: body.description ?? '',
      province: body.province,
      canton: body.canton,
      address: body.address ?? '',
      latitude: typeof body.latitude === 'number' ? body.latitude : null,
      longitude: typeof body.longitude === 'number' ? body.longitude : null,
      accepted_pet_types: body.accepted_pet_types ?? [],
      accepted_pet_sizes: body.accepted_pet_sizes ?? [],
      price_per_night: body.price_per_night ?? 0,
      price_per_hour: body.price_per_hour ?? 0,
      min_hours: body.min_hours ?? 1,
      max_pets: body.max_pets ?? 1,
      amenities: body.amenities ?? [],
      is_active: false,
      photos: body.photos ?? [],
      rating: 0,
      review_count: 0,
      created_at: now,
      updated_at: now,
    };
    await ddb.send(new PutCommand({ TableName: CORE_TABLE_NAME, Item: space }));
    return created(space);
  } catch (err) {
    return serverError(err);
  }
}
