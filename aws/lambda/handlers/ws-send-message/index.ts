import type { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { PutCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { ddb, MESSAGING_TABLE_NAME, messagingGsi, messagingKeys } from '../../shared/messaging-db';

interface SendMessagePayload {
  action: string;
  conversationId: string;
  body: string;
  senderId: string;
}

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  try {
    const payload: SendMessagePayload = JSON.parse(event.body ?? '{}');
    const { conversationId, body, senderId } = payload;
    if (!conversationId || !body || !senderId) return { statusCode: 400 };

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Persist message
    await ddb.send(new PutCommand({
      TableName: MESSAGING_TABLE_NAME,
      Item: {
        pk: messagingKeys.conversation(conversationId).pk,
        sk: messagingKeys.messageSk(now, id),
        id,
        conv_id: conversationId,
        sender_id: senderId,
        content: body,
        created_at: now,
      },
    }));

    // Get all participants
    const participantResult = await ddb.send(new QueryCommand({
      TableName: MESSAGING_TABLE_NAME,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: {
        ':pk': messagingKeys.conversation(conversationId).pk,
        ':prefix': messagingKeys.participantPrefix,
      },
    }));

    const domain = event.requestContext.domainName;
    const stage = event.requestContext.stage;
    const mgmt = new ApiGatewayManagementApiClient({ endpoint: `https://${domain}/${stage}` });

    for (const participant of participantResult.Items ?? []) {
      const userId = participant['userId'] as string;
      // Find connections for this user
      const connResult = await ddb.send(new QueryCommand({
        TableName: MESSAGING_TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'gsi1pk = :pk AND begins_with(gsi1sk, :prefix)',
        ExpressionAttributeValues: { ':pk': messagingGsi.userPk(userId), ':prefix': messagingKeys.connectionPrefix },
      }));
      for (const conn of connResult.Items ?? []) {
        const cid = conn['connectionId'] as string;
        try {
          await mgmt.send(new PostToConnectionCommand({
            ConnectionId: cid,
            Data: Buffer.from(JSON.stringify({ type: 'new_message', message: { id, conv_id: conversationId, sender_id: senderId, content: body, created_at: now } })),
          }));
        } catch {
          // Stale connection — clean up
          await ddb.send(new DeleteCommand({
            TableName: MESSAGING_TABLE_NAME,
            Key: messagingKeys.connection(cid),
          }));
        }
      }
    }

    return { statusCode: 200 };
  } catch (err) {
    console.error(err);
    return { statusCode: 500 };
  }
};
