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

// lambda/handlers/list-caregiver-bookings/index.ts
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
var bookingsGsi = {
  ownerPk: (ownerId) => `OWNER#${ownerId}`,
  caregiverPk: (caregiverId) => `CAREGIVER#${caregiverId}`
};

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
var serverError = (err) => {
  console.error(err);
  return {
    statusCode: 500,
    headers: JSON_HEADERS,
    body: JSON.stringify({ error: "Internal server error" })
  };
};

// lambda/handlers/list-caregiver-bookings/index.ts
async function safeGetItem(key) {
  try {
    const result = await ddb.send(new import_lib_dynamodb3.GetCommand({
      TableName: CORE_TABLE_NAME,
      Key: key
    }));
    return result.Item;
  } catch (error) {
    console.warn("Optional caregiver booking enrichment failed", { key, error });
    return void 0;
  }
}
function toUserName(item) {
  const fullName = typeof item?.["full_name"] === "string" && item["full_name"].trim() ? item["full_name"] : typeof item?.["fullName"] === "string" && item["fullName"].trim() ? item["fullName"] : void 0;
  const name = typeof item?.["name"] === "string" && item["name"].trim() ? item["name"] : fullName;
  const email = typeof item?.["email"] === "string" && item["email"].trim() ? item["email"] : void 0;
  return {
    name: name ?? email ?? "Usuario Donver",
    email
  };
}
function toSpaceName(item) {
  const name = typeof item?.["name"] === "string" && item["name"].trim() ? item["name"] : typeof item?.["title"] === "string" && item["title"].trim() ? item["title"] : void 0;
  return name ?? "Espacio Donver";
}
async function handler(event) {
  try {
    const { sub } = getAuthClaims(event);
    if (!await userHasRole(sub, "caregiver")) {
      return forbidden("Caregiver role required");
    }
    const result = await ddb.send(new import_lib_dynamodb3.QueryCommand({
      TableName: BOOKINGS_TABLE_NAME,
      IndexName: "GSI2",
      KeyConditionExpression: "gsi2pk = :pk AND begins_with(gsi2sk, :prefix)",
      ExpressionAttributeValues: { ":pk": bookingsGsi.caregiverPk(sub), ":prefix": "BOOKING#" }
    }));
    const bookings = result.Items ?? [];
    const enriched = await Promise.all(
      bookings.map(async (booking) => {
        const ownerId = String(booking["owner_id"] ?? "");
        const spaceId = String(booking["space_id"] ?? "");
        const [owner, space] = await Promise.all([
          ownerId ? safeGetItem(coreKeys.userProfile(ownerId)) : Promise.resolve(void 0),
          spaceId ? safeGetItem(coreKeys.space(spaceId)) : Promise.resolve(void 0)
        ]);
        const ownerSummary = toUserName(owner);
        const spaceName = toSpaceName(space);
        return {
          ...booking,
          owner_name: ownerSummary.name,
          owner_email: ownerSummary.email,
          space_name: spaceName
        };
      })
    );
    return ok(enriched);
  } catch (err) {
    return serverError(err);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
