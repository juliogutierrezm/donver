import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, CORE_TABLE_NAME, coreKeys } from '../../shared/core-db';
import { getAuthClaims, userHasRole } from '../../shared/auth';
import { noContent, forbidden, notFound, serverError } from '../../shared/response';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);
    if (!(await userHasRole(sub, 'owner'))) {
      return forbidden('No tienes perfil de dueño activo.');
    }
    const id = event.pathParameters?.['id'];
    if (!id) return notFound('Pet not found');

    const existing = await ddb.send(new GetCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.pet(id),
    }));
    if (!existing.Item) return notFound('Pet not found');
    if (existing.Item['owner_id'] !== sub) return forbidden();

    await ddb.send(new DeleteCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.pet(id),
    }));
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
