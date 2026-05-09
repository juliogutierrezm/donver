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

// lambda/handlers/list-messages/index.ts
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
var forbidden = (msg = "Forbidden") => ({
  statusCode: 403,
  headers: JSON_HEADERS,
  body: JSON.stringify({ error: msg })
});
var notFound = (msg = "Not found") => ({
  statusCode: 404,
  headers: JSON_HEADERS,
  body: JSON.stringify({ error: msg })
});
var serverError = (err) => {
  console.error(err);
  return {
    statusCode: 500,
    headers: JSON_HEADERS,
    body: JSON.stringify({ error: "Internal server error" })
  };
};

// lambda/handlers/list-messages/index.ts
async function handler(event) {
  try {
    const { sub } = getAuthClaims(event);
    const convId = event.pathParameters?.["id"];
    if (!convId) return notFound("Conversation not found");
    const participantResult = await ddb.send(new import_lib_dynamodb3.GetCommand({
      TableName: MESSAGING_TABLE_NAME,
      Key: { pk: messagingKeys.conversation(convId).pk, sk: messagingKeys.participantSk(sub) }
    }));
    if (!participantResult.Item) return forbidden();
    const result = await ddb.send(new import_lib_dynamodb3.QueryCommand({
      TableName: MESSAGING_TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: { ":pk": messagingKeys.conversation(convId).pk, ":prefix": messagingKeys.messagePrefix },
      ScanIndexForward: true
    }));
    return ok(result.Items ?? []);
  } catch (err) {
    return serverError(err);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
