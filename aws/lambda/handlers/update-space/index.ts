import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, CORE_TABLE_NAME, coreKeys } from '../../shared/core-db';
import { getAuthClaims, userHasRole } from '../../shared/auth';
import { badRequest, ok, forbidden, notFound, serverError } from '../../shared/response';
import { getMissingCaregiverFields, isSpacePublishReady } from '../../shared/profile';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);
    if (!(await userHasRole(sub, 'caregiver'))) {
      return forbidden('Caregiver role required');
    }

    const id = event.pathParameters?.['id'];
    if (!id) return notFound('Space not found');

    const existing = await ddb.send(new GetCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.space(id),
    }));
    if (!existing.Item) return notFound('Space not found');
    if (existing.Item['caregiver_id'] !== sub) return forbidden();

    const body = JSON.parse(event.body ?? '{}') as Record<string, unknown>;
    const now = new Date().toISOString();
    const allowed = ['name','description','province','canton','address','accepted_pet_types',
      'price_per_night','price_per_hour','max_pets','is_active','photos','latitude',
      'longitude','min_hours','accepted_pet_sizes','amenities'];
    const nextSpace = {
      ...(existing.Item as Record<string, unknown>),
      ...body,
    };

    if (body['is_active'] === true) {
      const profileResult = await ddb.send(new GetCommand({
        TableName: CORE_TABLE_NAME,
        Key: coreKeys.userProfile(sub),
      }));
      const missingProfileFields = getMissingCaregiverFields((profileResult.Item ?? {}) as Record<string, unknown>);
      if (missingProfileFields.length > 0) {
        return badRequest('Complete your caregiver profile before publishing spaces');
      }
      if (!isSpacePublishReady(nextSpace)) {
        return badRequest('Complete all required space fields before publishing');
      }
    }

    const exprParts: string[] = ['updated_at = :now'];
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = { ':now': now };

    for (const key of allowed) {
      if (body[key] !== undefined) {
        const safe = key === 'name' ? '#name' : `#${key}`;
        exprParts.push(`${safe} = :${key}`);
        names[safe] = key;
        values[`:${key}`] = body[key];
      }
    }

    const result = await ddb.send(new UpdateCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.space(id),
      UpdateExpression: `SET ${exprParts.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    }));
    return ok(result.Attributes);
  } catch (err) {
    return serverError(err);
  }
}
