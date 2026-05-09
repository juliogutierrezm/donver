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

// lambda/handlers/create-booking/index.ts
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
var bookingsGsi = {
  ownerPk: (ownerId) => `OWNER#${ownerId}`,
  caregiverPk: (caregiverId) => `CAREGIVER#${caregiverId}`
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
function isOwnerProfileActive(value) {
  if (value === false || value === "false" || value === 0 || value === "0") {
    return false;
  }
  return true;
}
function resolveProfileRoles(item, fallbackRoles = ["owner"]) {
  const legacyRole = typeof item.role === "string" ? [item.role] : [];
  const rawRoles = normalizeRoles(item.roles ?? legacyRole);
  const effectiveRoles = isOwnerProfileActive(item.owner_profile_active) ? rawRoles : rawRoles.filter((role) => role !== "owner");
  if (effectiveRoles.length) {
    return effectiveRoles;
  }
  return item.signup_intent === "caregiver" ? [] : fallbackRoles;
}
async function userHasRole(sub, role) {
  const result = await ddb.send(new import_lib_dynamodb2.GetCommand({
    TableName: CORE_TABLE_NAME,
    Key: coreKeys.userProfile(sub)
  }));
  const profileRoles = result.Item ? resolveProfileRoles(result.Item) : [];
  return profileRoles.includes(role);
}

// lambda/shared/booking-pricing.ts
var DEFAULT_ADDITIONAL_PET_RATE = 0.4;
function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}
function calculateBookingPricing(input) {
  const additionalPetRate = input.additionalPetRate ?? DEFAULT_ADDITIONAL_PET_RATE;
  const petCount = Math.max(1, input.petCount);
  const unitCount = input.bookingType === "overnight" ? Math.max(
    1,
    Math.floor(
      (new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) / (1e3 * 60 * 60 * 24)
    )
  ) : Math.max(1, input.hours ?? 1);
  const unitPrice = input.bookingType === "overnight" ? input.pricePerNight : input.pricePerHour;
  const baseSubtotal = roundCurrency(unitPrice * unitCount);
  const additionalPetFee = petCount > 1 ? roundCurrency(baseSubtotal * additionalPetRate * (petCount - 1)) : 0;
  const subtotal = roundCurrency(baseSubtotal + additionalPetFee);
  const serviceFee = roundCurrency(subtotal * 0.1);
  const totalPrice = roundCurrency(subtotal + serviceFee);
  return {
    unitCount,
    baseSubtotal,
    additionalPetFee,
    subtotal,
    serviceFee,
    totalPrice,
    additionalPetRate
  };
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

// lambda/handlers/create-booking/index.ts
async function handler(event) {
  try {
    const { sub } = getAuthClaims(event);
    if (!await userHasRole(sub, "owner")) {
      return forbidden("No tienes perfil de due\xF1o activo.");
    }
    const body = JSON.parse(event.body ?? "{}");
    if (!body.space_id || !body.start_date || !body.end_date || body.subtotal === void 0) {
      return badRequest("space_id, start_date, end_date, subtotal required");
    }
    const petIds = Array.isArray(body.pet_ids) ? Array.from(new Set(body.pet_ids.map(String))) : [];
    if (petIds.length === 0) {
      return badRequest("Select at least one pet for the booking");
    }
    const spaceResult = await ddb.send(new import_lib_dynamodb3.GetCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.space(body.space_id)
    }));
    if (!spaceResult.Item) return notFound("Space not found");
    const space = spaceResult.Item;
    const caregiverId = String(space["caregiver_id"] ?? "");
    if (caregiverId && caregiverId === sub) {
      return forbidden("No puedes reservar tu propio espacio.");
    }
    const maxPets = Number(space["max_pets"] ?? 1);
    if (petIds.length > maxPets) {
      return badRequest(`Este espacio permite m\xE1ximo ${maxPets} mascotas por reserva.`);
    }
    const blockedResult = await ddb.send(new import_lib_dynamodb3.QueryCommand({
      TableName: BOOKINGS_TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: { ":pk": bookingKeys.spacePk(body.space_id), ":prefix": bookingKeys.blockedPrefix }
    }));
    for (const bd of blockedResult.Items ?? []) {
      const d = bd["date"];
      if (d >= body.start_date && d <= body.end_date) {
        return badRequest("Selected dates are blocked");
      }
    }
    const existingBookings = await ddb.send(new import_lib_dynamodb3.QueryCommand({
      TableName: BOOKINGS_TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: { ":pk": bookingKeys.spacePk(body.space_id), ":prefix": bookingKeys.spaceBookingPrefix }
    }));
    for (const bk of existingBookings.Items ?? []) {
      if (bk["status"] === "cancelled") continue;
      const bkStart = bk["start_date"];
      const bkEnd = bk["end_date"];
      if (bkStart <= body.end_date && bkEnd >= body.start_date) {
        return badRequest("Selected dates are already booked");
      }
    }
    const pricing = calculateBookingPricing({
      bookingType: body.booking_type ?? "overnight",
      startDate: body.start_date,
      endDate: body.end_date,
      pricePerNight: Number(space["price_per_night"] ?? 0),
      pricePerHour: Number(space["price_per_hour"] ?? 0),
      hours: body.hours,
      petCount: petIds.length,
      additionalPetRate: typeof space["additional_pet_rate"] === "number" ? space["additional_pet_rate"] : DEFAULT_ADDITIONAL_PET_RATE
    });
    const id = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await ddb.send(new import_lib_dynamodb3.TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: BOOKINGS_TABLE_NAME,
            Item: {
              ...bookingKeys.booking(id),
              gsi1pk: bookingsGsi.ownerPk(sub),
              gsi1sk: `BOOKING#${id}`,
              gsi2pk: bookingsGsi.caregiverPk(caregiverId),
              gsi2sk: `BOOKING#${id}`,
              id,
              space_id: body.space_id,
              owner_id: sub,
              caregiver_id: caregiverId,
              pet_ids: petIds,
              booking_type: body.booking_type ?? "overnight",
              start_date: body.start_date,
              end_date: body.end_date,
              start_time: body.start_time ?? "",
              end_time: body.end_time ?? "",
              hours: body.hours ?? 0,
              subtotal: pricing.subtotal,
              service_fee: pricing.serviceFee,
              total_price: pricing.totalPrice,
              status: "pending",
              notes: body.notes ?? "",
              created_at: now,
              updated_at: now
            }
          }
        },
        {
          Put: {
            TableName: BOOKINGS_TABLE_NAME,
            Item: {
              pk: bookingKeys.spacePk(body.space_id),
              sk: bookingKeys.spaceBookingSk(body.start_date, id),
              booking_id: id,
              start_date: body.start_date,
              end_date: body.end_date,
              status: "pending"
            }
          }
        }
      ]
    }));
    return created({
      id,
      space_id: body.space_id,
      owner_id: sub,
      caregiver_id: caregiverId,
      pet_ids: petIds,
      booking_type: body.booking_type ?? "overnight",
      start_date: body.start_date,
      end_date: body.end_date,
      start_time: body.start_time ?? "",
      end_time: body.end_time ?? "",
      hours: body.hours ?? 0,
      subtotal: pricing.subtotal,
      service_fee: pricing.serviceFee,
      total_price: pricing.totalPrice,
      status: "pending",
      notes: body.notes ?? "",
      created_at: now,
      updated_at: now
    });
  } catch (err) {
    return serverError(err);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
