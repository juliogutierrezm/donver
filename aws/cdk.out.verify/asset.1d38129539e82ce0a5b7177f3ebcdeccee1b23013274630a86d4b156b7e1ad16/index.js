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

// lambda/handlers/ws-connect/index.ts
var index_exports = {};
__export(index_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(index_exports);
var import_lib_dynamodb2 = require("@aws-sdk/lib-dynamodb");

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

// lambda/handlers/ws-connect/index.ts
var handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const query = event.queryStringParameters;
  const userId = query?.["userId"] ?? "";
  if (!userId) return { statusCode: 401 };
  try {
    const ttl = Math.floor(Date.now() / 1e3) + 86400;
    await ddb.send(new import_lib_dynamodb2.PutCommand({
      TableName: MESSAGING_TABLE_NAME,
      Item: {
        ...messagingKeys.connection(connectionId),
        gsi1pk: messagingGsi.userPk(userId),
        gsi1sk: `${messagingKeys.connectionPrefix}${connectionId}`,
        connectionId,
        userId,
        ttl
      }
    }));
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
