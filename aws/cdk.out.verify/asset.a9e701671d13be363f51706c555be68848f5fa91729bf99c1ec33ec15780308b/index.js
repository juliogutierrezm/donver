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

// lambda/handlers/get-space-detail/index.ts
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

// lambda/shared/core-db.ts
var CORE_TABLE_NAME = process.env["CORE_TABLE_NAME"];
var coreKeys = {
  userProfile: (sub) => ({ pk: `USER#${sub}`, sk: "PROFILE" }),
  space: (id) => ({ pk: `SPACE#${id}`, sk: "DETAIL" }),
  pet: (id) => ({ pk: `PET#${id}`, sk: "DETAIL" }),
  reviewPk: (spaceId) => `SPACE#${spaceId}`,
  reviewSk: (createdAtIso, id) => `REVIEW#${createdAtIso}#${id}`,
  reviewPrefix: "REVIEW#"
};

// lambda/shared/bookings-db.ts
var BOOKINGS_TABLE_NAME = process.env["BOOKINGS_TABLE_NAME"];
var bookingKeys = {
  booking: (id) => ({ pk: `BOOKING#${id}`, sk: "DETAIL" }),
  spacePk: (spaceId) => `SPACE#${spaceId}`,
  blockedSk: (date) => `BLOCKED#${date}`,
  blockedPrefix: "BLOCKED#",
  spaceBookingSk: (startDate, bookingId) => `BOOKING#${startDate}#${bookingId}`,
  spaceBookingPrefix: "BOOKING#"
};

// lambda/shared/response.ts
var JSON_HEADERS = { "content-type": "application/json" };
var ok = (body) => ({
  statusCode: 200,
  headers: JSON_HEADERS,
  body: JSON.stringify(body)
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

// lambda/handlers/get-space-detail/index.ts
async function handler(event) {
  try {
    const id = event.pathParameters?.["id"];
    if (!id) return notFound("Space not found");
    const [spaceResult, blockedResult] = await Promise.all([
      ddb.send(new import_lib_dynamodb2.GetCommand({
        TableName: CORE_TABLE_NAME,
        Key: coreKeys.space(id)
      })),
      ddb.send(new import_lib_dynamodb2.QueryCommand({
        TableName: BOOKINGS_TABLE_NAME,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
        ExpressionAttributeValues: { ":pk": bookingKeys.spacePk(id), ":prefix": bookingKeys.blockedPrefix }
      }))
    ]);
    if (!spaceResult.Item || spaceResult.Item["is_active"] !== true) return notFound("Space not found");
    return ok({ space: spaceResult.Item, blockedDates: blockedResult.Items ?? [] });
  } catch (err) {
    return serverError(err);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
