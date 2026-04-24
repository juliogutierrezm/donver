import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, MESSAGING_TABLE_NAME, messagingKeys } from '../../shared/messaging-db';
import { getAuthClaims } from '../../shared/auth';
import { ok, forbidden, notFound, serverError } from '../../shared/response';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);
    const convId = event.pathParameters?.['id'];
    if (!convId) return notFound('Conversation not found');

    // Verify participant
    const participantResult = await ddb.send(new GetCommand({
      TableName: MESSAGING_TABLE_NAME,
      Key: { pk: messagingKeys.conversation(convId).pk, sk: messagingKeys.participantSk(sub) },
    }));
    if (!participantResult.Item) return forbidden();

    const result = await ddb.send(new QueryCommand({
      TableName: MESSAGING_TABLE_NAME,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: { ':pk': messagingKeys.conversation(convId).pk, ':prefix': messagingKeys.messagePrefix },
      ScanIndexForward: true,
    }));
    return ok(result.Items ?? []);
  } catch (err) {
    return serverError(err);
  }
}
