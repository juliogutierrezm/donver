import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, CORE_TABLE_NAME, coreGsi, coreKeys } from '../../shared/core-db';
import { getAuthClaims } from '../../shared/auth';
import { created, badRequest, serverError } from '../../shared/response';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);
    const body = JSON.parse(event.body ?? '{}') as {
      name?: string; description?: string; province?: string; canton?: string;
      address?: string; accepted_pet_types?: string[]; price_per_night?: number;
      price_per_hour?: number; max_pets?: number;
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
      accepted_pet_types: body.accepted_pet_types ?? [],
      price_per_night: body.price_per_night ?? 0,
      price_per_hour: body.price_per_hour ?? 0,
      max_pets: body.max_pets ?? 1,
      is_active: true,
      photos: [],
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
