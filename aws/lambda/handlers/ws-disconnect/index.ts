import type { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, MESSAGING_TABLE_NAME, messagingKeys } from '../../shared/messaging-db';

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;
  try {
    await ddb.send(new DeleteCommand({
      TableName: MESSAGING_TABLE_NAME,
      Key: messagingKeys.connection(connectionId),
    }));
    return { statusCode: 200 };
  } catch (err) {
    console.error(err);
    return { statusCode: 500 };
  }
};
