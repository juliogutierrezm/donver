import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, CORE_TABLE_NAME, coreKeys } from '../../shared/core-db';
import { getAuthClaims } from '../../shared/auth';
import { ok, serverError } from '../../shared/response';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub, email } = getAuthClaims(event);
    const now = new Date().toISOString();

    const existing = await ddb.send(new GetCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.userProfile(sub),
    }));

    if (!existing.Item) {
      const profile = {
        pk: `USER#${sub}`,
        sk: 'PROFILE',
        sub,
        email,
        name: email.split('@')[0],
        role: 'owner',
        bio: '',
        phone: '',
        avatar_url: '',
        created_at: now,
        updated_at: now,
      };
      await ddb.send(new PutCommand({ TableName: CORE_TABLE_NAME, Item: profile }));
      return ok(profile);
    }

    const updated = await ddb.send(new UpdateCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.userProfile(sub),
      UpdateExpression: 'SET #email = :email, updated_at = :now',
      ExpressionAttributeNames: { '#email': 'email' },
      ExpressionAttributeValues: { ':email': email, ':now': now },
      ReturnValues: 'ALL_NEW',
    }));
    return ok(updated.Attributes);
  } catch (err) {
    return serverError(err);
  }
}
