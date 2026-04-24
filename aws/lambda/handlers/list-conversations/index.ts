import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, MESSAGING_TABLE_NAME, messagingGsi, messagingKeys } from '../../shared/messaging-db';
import { getAuthClaims } from '../../shared/auth';
import { ok, serverError } from '../../shared/response';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);

    // Get participant items for this user
    const participantResult = await ddb.send(new QueryCommand({
      TableName: MESSAGING_TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'gsi1pk = :pk AND begins_with(gsi1sk, :prefix)',
      ExpressionAttributeValues: { ':pk': messagingGsi.userPk(sub), ':prefix': 'CONV#' },
    }));

    const convIds = (participantResult.Items ?? []).map((i: Record<string, unknown>) => i['conv_id'] as string);
    if (convIds.length === 0) return ok([]);

    // Batch get conversation details
    const conversationKeys = convIds.map((convId: string) => messagingKeys.conversation(convId));
    const batchResult = await ddb.send(new BatchGetCommand({
      RequestItems: { [MESSAGING_TABLE_NAME]: { Keys: conversationKeys } },
    }));
    const convDetails = (batchResult.Responses?.[MESSAGING_TABLE_NAME] ?? []);

    // Get last message for each conversation
    const enriched = await Promise.all(convDetails.map(async (conv: Record<string, unknown>) => {
      const convId = conv['id'] as string;
      const msgResult = await ddb.send(new QueryCommand({
        TableName: MESSAGING_TABLE_NAME,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
        ExpressionAttributeValues: { ':pk': messagingKeys.conversation(convId).pk, ':prefix': messagingKeys.messagePrefix },
        ScanIndexForward: false,
        Limit: 1,
      }));
      return { ...conv, last_message: msgResult.Items?.[0] ?? null };
    }));

    return ok(enriched);
  } catch (err) {
    return serverError(err);
  }
}
