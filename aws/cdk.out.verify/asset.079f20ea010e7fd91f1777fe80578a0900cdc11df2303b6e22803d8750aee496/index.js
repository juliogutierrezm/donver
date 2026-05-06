"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lambda/handlers/ws-send-message/index.ts
var index_exports = {};
__export(index_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(index_exports);
var import_lib_dynamodb2 = require("@aws-sdk/lib-dynamodb");
var import_client_apigatewaymanagementapi = require("@aws-sdk/client-apigatewaymanagementapi");

// lambda/shared/ddb-client.ts
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var client = new import_client_dynamodb.DynamoDBClient({});
var ddb = import_lib_dynamodb.DynamoDBDocumentClient.from(client);

// lambda/shared/messaging-db.ts
var MESSAGING_TABLE_NAME = process.env["MESSAGING_TABLE_NAME"];
var messagingKeys = {
  conversation: (id) => ({ pk: `CONV#${id}`, sk: "DETAIL" }),
  messageSk: (createdAtIso, id) => `MSG#${createdAtIso}#${id}`,
  messagePrefix: "MSG#",
  participantSk: (userId) => `PARTICIPANT#${userId}`,
  participantPrefix: "PARTICIPANT#",
  connection: (connectionId) => ({ pk: `CONN#${connectionId}`, sk: "CONNECTION" }),
  connectionPrefix: "CONN#"
};
var messagingGsi = {
  userPk: (userId) => `USER#${userId}`
};

// lambda/handlers/ws-send-message/index.ts
var handler = async (event) => {
  try {
    const payload = JSON.parse(event.body ?? "{}");
    const { conversationId, body, senderId } = payload;
    if (!conversationId || !body || !senderId) return { statusCode: 400 };
    const id = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await ddb.send(new import_lib_dynamodb2.PutCommand({
      TableName: MESSAGING_TABLE_NAME,
      Item: {
        pk: messagingKeys.conversation(conversationId).pk,
        sk: messagingKeys.messageSk(now, id),
        id,
        conv_id: conversationId,
        sender_id: senderId,
        content: body,
        created_at: now
      }
    }));
    const participantResult = await ddb.send(new import_lib_dynamodb2.QueryCommand({
      TableName: MESSAGING_TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: {
        ":pk": messagingKeys.conversation(conversationId).pk,
        ":prefix": messagingKeys.participantPrefix
      }
    }));
    const domain = event.requestContext.domainName;
    const stage = event.requestContext.stage;
    const mgmt = new import_client_apigatewaymanagementapi.ApiGatewayManagementApiClient({ endpoint: `https://${domain}/${stage}` });
    for (const participant of participantResult.Items ?? []) {
      const userId = participant["userId"];
      const connResult = await ddb.send(new import_lib_dynamodb2.QueryCommand({
        TableName: MESSAGING_TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "gsi1pk = :pk AND begins_with(gsi1sk, :prefix)",
        ExpressionAttributeValues: { ":pk": messagingGsi.userPk(userId), ":prefix": messagingKeys.connectionPrefix }
      }));
      for (const conn of connResult.Items ?? []) {
        const cid = conn["connectionId"];
        try {
          await mgmt.send(new import_client_apigatewaymanagementapi.PostToConnectionCommand({
            ConnectionId: cid,
            Data: Buffer.from(JSON.stringify({ type: "new_message", message: { id, conv_id: conversationId, sender_id: senderId, content: body, created_at: now } }))
          }));
        } catch {
          await ddb.send(new import_lib_dynamodb2.DeleteCommand({
            TableName: MESSAGING_TABLE_NAME,
            Key: messagingKeys.connection(cid)
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
