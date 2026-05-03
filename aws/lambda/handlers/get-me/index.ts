import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, CORE_TABLE_NAME, coreKeys } from '../../shared/core-db';
import { getAuthClaims } from '../../shared/auth';
import { ok, notFound, serverError } from '../../shared/response';
import { normalizeProfileWithStatus } from '../../shared/profile';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);
    const result = await ddb.send(new GetCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.userProfile(sub),
    }));
    if (!result.Item) return notFound('Profile not found');
    return ok(await normalizeProfileWithStatus(result.Item as Record<string, unknown>));
  } catch (err) {
    return serverError(err);
  }
}
