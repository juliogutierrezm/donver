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

// lambda/handlers/get-booking-detail/index.ts
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

// lambda/handlers/get-booking-detail/index.ts
async function safeGetItem(key, tableName) {
  try {
    const result = await ddb.send(new import_lib_dynamodb3.GetCommand({
      TableName: tableName,
      Key: key
    }));
    return result.Item;
  } catch (error) {
    console.warn("Optional booking detail lookup failed", { tableName, key, error });
    return void 0;
  }
}
function toPartySummary(item, userId) {
  const fullName = typeof item?.["full_name"] === "string" && item["full_name"].trim() ? item["full_name"] : typeof item?.["fullName"] === "string" && item["fullName"].trim() ? item["fullName"] : void 0;
  const name = typeof item?.["name"] === "string" && item["name"].trim() ? item["name"] : fullName;
  const email = typeof item?.["email"] === "string" && item["email"].trim() ? item["email"] : void 0;
  return {
    id: userId,
    name: name ?? email ?? "Usuario Donver",
    avatar_url: typeof item["avatar_url"] === "string" && item["avatar_url"].trim() ? item["avatar_url"] : void 0
  };
}
function toSpaceSummary(item) {
  if (!item) return void 0;
  return {
    id: String(item["id"] ?? ""),
    name: typeof item["name"] === "string" ? item["name"] : "",
    province: typeof item["province"] === "string" ? item["province"] : void 0,
    canton: typeof item["canton"] === "string" ? item["canton"] : void 0,
    address: typeof item["address"] === "string" ? item["address"] : void 0,
    price_per_night: typeof item["price_per_night"] === "number" ? item["price_per_night"] : 0,
    price_per_hour: typeof item["price_per_hour"] === "number" ? item["price_per_hour"] : 0,
    additional_pet_rate: typeof item["additional_pet_rate"] === "number" ? item["additional_pet_rate"] : void 0
  };
}
function toPetSummary(item) {
  if (!item) return void 0;
  return {
    id: String(item["id"] ?? ""),
    name: typeof item["name"] === "string" ? item["name"] : "",
    species: typeof item["species"] === "string" ? item["species"] : "other",
    breed: typeof item["breed"] === "string" && item["breed"].trim() ? item["breed"] : void 0,
    size: typeof item["size"] === "string" && item["size"].trim() ? item["size"] : void 0
  };
}
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
    if (booking["owner_id"] !== sub && booking["caregiver_id"] !== sub) {
      return forbidden();
    }
    const response = { ...booking };
    const spaceId = typeof booking["space_id"] === "string" ? booking["space_id"] : "";
    const ownerId = typeof booking["owner_id"] === "string" ? booking["owner_id"] : "";
    const caregiverId = typeof booking["caregiver_id"] === "string" ? booking["caregiver_id"] : "";
    const petIds = Array.isArray(booking["pet_ids"]) ? booking["pet_ids"].map(String) : [];
    const [spaceItem, ownerItem, caregiverItem, pets] = await Promise.all([
      spaceId ? safeGetItem(coreKeys.space(spaceId), CORE_TABLE_NAME) : Promise.resolve(void 0),
      ownerId ? safeGetItem(coreKeys.userProfile(ownerId), CORE_TABLE_NAME) : Promise.resolve(void 0),
      caregiverId ? safeGetItem(coreKeys.userProfile(caregiverId), CORE_TABLE_NAME) : Promise.resolve(void 0),
      Promise.all(
        petIds.map(async (petId) => {
          const petItem = await safeGetItem(coreKeys.pet(petId), CORE_TABLE_NAME);
          return toPetSummary(petItem);
        })
      )
    ]);
    const space = toSpaceSummary(spaceItem);
    if (space) response["space"] = space;
    const owner = toPartySummary(ownerItem, ownerId);
    if (owner) response["owner"] = owner;
    const caregiver = toPartySummary(caregiverItem, caregiverId);
    if (caregiver) response["caregiver"] = caregiver;
    const relatedPets = pets.filter(Boolean);
    if (relatedPets.length > 0) response["pets"] = relatedPets;
    return ok(response);
  } catch (err) {
    return serverError(err);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
