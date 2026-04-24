import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, CORE_TABLE_NAME, coreGsi, coreKeys } from '../../shared/core-db';
import { getAuthClaims } from '../../shared/auth';
import { created, badRequest, serverError } from '../../shared/response';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);
    const body = JSON.parse(event.body ?? '{}') as {
      name?: string; species?: string; breed?: string; age?: number;
      weight?: number; photos?: string[]; medical_notes?: string;
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
