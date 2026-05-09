import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, CORE_TABLE_NAME, coreGsi, coreKeys } from '../../shared/core-db';
import { getAuthClaims, userHasRole } from '../../shared/auth';
import { created, badRequest, forbidden, serverError } from '../../shared/response';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);
    if (!(await userHasRole(sub, 'owner'))) {
      return forbidden('No tienes perfil de dueño activo.');
    }
    const body = JSON.parse(event.body ?? '{}') as {
      name?: string; species?: string; breed?: string; age?: number;
      weight?: number; size?: string; description?: string; photos?: string[]; medical_notes?: string;
    };
    if (!body.name || !body.species) return badRequest('name and species required');

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pet = {
      ...coreKeys.pet(id),
      gsi1pk: coreGsi.ownerPk(sub),
      gsi1sk: `PET#${id}`,
      id,
      owner_id: sub,
      name: body.name,
      species: body.species,
      breed: body.breed ?? '',
      age: body.age ?? 0,
      weight: body.weight ?? 0,
      size: body.size ?? 'medium',
      description: body.description ?? '',
      photos: body.photos ?? [],
      medical_notes: body.medical_notes ?? '',
      created_at: now,
      updated_at: now,
    };
    await ddb.send(new PutCommand({ TableName: CORE_TABLE_NAME, Item: pet }));
    return created(pet);
  } catch (err) {
    return serverError(err);
  }
}
