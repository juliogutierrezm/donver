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

// lambda/handlers/create-blocked-date/index.ts
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

// lambda/shared/auth.ts
var import_lib_dynamodb2 = require("@aws-sdk/lib-dynamodb");
function getAuthClaims(event) {
  const claims = event.requestContext.authorizer.jwt.claims;
  const groupsValue = String(claims["cognito:groups"] ?? "");
  return {
    sub: String(claims["sub"]),
    email: String(claims["email"] ?? ""),
    groups: groupsValue ? groupsValue.split(",").map((group) => group.trim()).filter(Boolean) : []
  };
}
function normalizeRoles(roles) {
  const values = typeof roles === "string" ? [roles] : Array.isArray(roles) ? roles : [];
  const normalized = values.flatMap((role) => {
    const value = String(role);
    if (value === "both") return ["owner", "caregiver"];
    return value === "owner" || value === "caregiver" ? [value] : [];
  });
  return Array.from(new Set(normalized));
}
async function userHasRole(sub, role) {
  const result = await ddb.send(new import_lib_dynamodb2.GetCommand({
    TableName: CORE_TABLE_NAME,
    Key: coreKeys.userProfile(sub)
  }));
  const profileRoles = normalizeRoles(result.Item?.["roles"] ?? result.Item?.["role"]);
  return profileRoles.includes(role);
}

// lambda/shared/response.ts
var JSON_HEADERS = { "content-type": "application/json" };
var created = (body) => ({
  statusCode: 201,
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

// lambda/handlers/create-blocked-date/index.ts
async function handler(event) {
  try {
    const { sub } = getAuthClaims(event);
    if (!await userHasRole(sub, "caregiver")) {
      return forbidden("Caregiver role required");
    }
    const spaceId = event.pathParameters?.["id"];
    if (!spaceId) return notFound("Space not found");
    const body = JSON.parse(event.body ?? "{}");
    if (!body.date) return badRequest("date required");
    const spaceResult = await ddb.send(new import_lib_dynamodb3.GetCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.space(spaceId)
    }));
    if (!spaceResult.Item) return notFound("Space not found");
    if (spaceResult.Item["caregiver_id"] !== sub) return forbidden();
    const item = {
      pk: `SPACE#${spaceId}`,
      sk: bookingKeys.blockedSk(body.date),
      id: body.date,
      date: body.date,
      reason: body.reason ?? ""
    };
    await ddb.send(new import_lib_dynamodb3.PutCommand({ TableName: BOOKINGS_TABLE_NAME, Item: item }));
    return created(item);
  } catch (err) {
    return serverError(err);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
