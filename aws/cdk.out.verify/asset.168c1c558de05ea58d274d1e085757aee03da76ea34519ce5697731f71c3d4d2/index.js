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

// lambda/handlers/list-conversations/index.ts
var index_exports = {};
__export(index_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(index_exports);
var import_lib_dynamodb3 = require("@aws-sdk/lib-dynamodb");

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

// lambda/shared/auth.ts
var import_lib_dynamodb2 = require("@aws-sdk/lib-dynamodb");

// lambda/shared/core-db.ts
var CORE_TABLE_NAME = process.env["CORE_TABLE_NAME"];

// lambda/shared/auth.ts
function getAuthClaims(event) {
  const claims = event.requestContext.authorizer.jwt.claims;
  const groupsValue = String(claims["cognito:groups"] ?? "");
  return {
    sub: String(claims["sub"]),
    email: String(claims["email"] ?? ""),
    groups: groupsValue ? groupsValue.split(",").map((group) => group.trim()).filter(Boolean) : []
  };
}

// lambda/shared/response.ts
var JSON_HEADERS = { "content-type": "application/json" };
var ok = (body) => ({
  statusCode: 200,
  headers: JSON_HEADERS,
  body: JSON.stringify(body)
});
var serverError = (err) => {
  console.error(err);
  return {
    statusCode: 500,
    headers: JSON_HEADERS,
    body: JSON.stringify({ error: "Internal server error" })
  };
};

// lambda/handlers/list-conversations/index.ts
async function handler(event) {
  try {
    const { sub } = getAuthClaims(event);
    const participantResult = await ddb.send(new import_lib_dynamodb3.QueryCommand({
      TableName: MESSAGING_TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "gsi1pk = :pk AND begins_with(gsi1sk, :prefix)",
      ExpressionAttributeValues: { ":pk": messagingGsi.userPk(sub), ":prefix": "CONV#" }
    }));
    const convIds = (participantResult.Items ?? []).map((i) => i["conv_id"]);
    if (convIds.length === 0) return ok([]);
    const conversationKeys = convIds.map((convId) => messagingKeys.conversation(convId));
    const batchResult = await ddb.send(new import_lib_dynamodb3.BatchGetCommand({
      RequestItems: { [MESSAGING_TABLE_NAME]: { Keys: conversationKeys } }
    }));
    const convDetails = batchResult.Responses?.[MESSAGING_TABLE_NAME] ?? [];
    const enriched = await Promise.all(convDetails.map(async (conv) => {
      const convId = conv["id"];
      const msgResult = await ddb.send(new import_lib_dynamodb3.QueryCommand({
        TableName: MESSAGING_TABLE_NAME,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
        ExpressionAttributeValues: { ":pk": messagingKeys.conversation(convId).pk, ":prefix": messagingKeys.messagePrefix },
        ScanIndexForward: false,
        Limit: 1
      }));
      return { ...conv, last_message: msgResult.Items?.[0] ?? null };
    }));
    return ok(enriched);
  } catch (err) {
    return serverError(err);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
