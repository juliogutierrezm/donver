import type { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, MESSAGING_TABLE_NAME, messagingGsi, messagingKeys } from '../../shared/messaging-db';

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const query = (event as { queryStringParameters?: Record<string, string | undefined> })
    .queryStringParameters;
  const userId = query?.['userId'] ?? '';
  if (!userId) return { statusCode: 401 };

  try {
    const ttl = Math.floor(Date.now() / 1000) + 86400;
    await ddb.send(new PutCommand({
      TableName: MESSAGING_TABLE_NAME,
      Item: {
        ...messagingKeys.connection(connectionId),
        gsi1pk: messagingGsi.userPk(userId),
        gsi1sk: `${messagingKeys.connectionPrefix}${connectionId}`,
        connectionId,
        userId,
        ttl,
      },
    }));
    return { statusCode: 200 };
  } catch (err) {
    console.error(err);
    return { statusCode: 500 };
  }
};
