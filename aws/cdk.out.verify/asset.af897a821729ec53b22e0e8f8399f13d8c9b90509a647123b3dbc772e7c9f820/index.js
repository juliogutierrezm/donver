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

// lambda/handlers/confirm-booking/index.ts
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
var badRequest = (msg) => ({
  statusCode: 400,
  headers: JSON_HEADERS,
  body: JSON.stringify({ error: msg })
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

// lambda/handlers/confirm-booking/index.ts
async function handler(event) {
  try {
    const { sub } = getAuthClaims(event);
    const id = event.pathParameters?.["id"];
    if (!id) return notFound("Booking not found");
    const result = await ddb.send(new import_lib_dynamodb3.GetCommand({
      TableName: BOOKINGS_TABLE_NAME,
      Key: bookingKeys.booking(id)
    }));
    if (!result.Item) return notFound("Booking not found");
    const booking = result.Item;
    if (booking["caregiver_id"] !== sub) {
      return forbidden("Only the caregiver can confirm this booking");
    }
    if (booking["status"] !== "pending") {
      return badRequest("Only pending bookings can be confirmed");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await ddb.send(new import_lib_dynamodb3.TransactWriteCommand({
      TransactItems: [
        {
          Update: {
            TableName: BOOKINGS_TABLE_NAME,
            Key: bookingKeys.booking(id),
            UpdateExpression: "SET #status = :confirmed, updated_at = :now",
            ExpressionAttributeNames: { "#status": "status" },
            ExpressionAttributeValues: { ":confirmed": "confirmed", ":now": now }
          }
        },
        {
          Update: {
            TableName: BOOKINGS_TABLE_NAME,
            Key: {
              pk: bookingKeys.spacePk(String(booking["space_id"] ?? "")),
              sk: bookingKeys.spaceBookingSk(String(booking["start_date"] ?? ""), id)
            },
            UpdateExpression: "SET #status = :confirmed",
            ExpressionAttributeNames: { "#status": "status" },
            ExpressionAttributeValues: { ":confirmed": "confirmed" }
          }
        }
      ]
    }));
    return ok({ ...booking, status: "confirmed", updated_at: now });
  } catch (error) {
    return serverError(error);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
