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

// lambda/handlers/update-profile/index.ts
var index_exports = {};
__export(index_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(index_exports);
var import_lib_dynamodb4 = require("@aws-sdk/lib-dynamodb");

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
var coreGsi = {
  allSpacesPk: "ALL_SPACES",
  caregiverPk: (caregiverId) => `CAREGIVER#${caregiverId}`,
  ownerPk: (ownerId) => `OWNER#${ownerId}`,
  reviewerPk: (reviewerId) => `REVIEWER#${reviewerId}`
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
var APP_ROLES = ["owner", "caregiver"];
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

// lambda/shared/profile.ts
var import_lib_dynamodb3 = require("@aws-sdk/lib-dynamodb");
function readString(value) {
  return typeof value === "string" ? value.trim() : "";
}
function hasNonEmptyString(value) {
  return readString(value).length > 0;
}
function asFiniteNumber(value) {
  return typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
}
function normalizeSignupIntent(value) {
  return value === "caregiver" ? "caregiver" : null;
}
function normalizeProfileRecord(item, fallbackRoles = ["owner"]) {
  const signupIntent = normalizeSignupIntent(item.signup_intent);
  const nextRoles = resolveProfileRoles(item, fallbackRoles);
  const requestedActiveRole = readString(item.active_role);
  const activeRole = APP_ROLES.includes(requestedActiveRole) && nextRoles.includes(requestedActiveRole) ? requestedActiveRole : signupIntent === "caregiver" && nextRoles.length === 0 ? "caregiver" : nextRoles[0] ?? "owner";
  return {
    ...item,
    roles: nextRoles,
    active_role: activeRole,
    signup_intent: signupIntent
  };
}
function getMissingCaregiverFields(profile) {
  const requiredFields = [
    ["name", profile.name],
    ["phone", profile.phone],
    ["province", profile.province],
    ["canton", profile.canton],
    ["bio", profile.bio]
  ];
  return requiredFields.filter(([, value]) => !hasNonEmptyString(value)).map(([field]) => field);
}
function isSpacePublishReady(space) {
  const title = readString(space.name ?? space.title);
  const description = readString(space.description);
  const province = readString(space.province);
  const canton = readString(space.canton);
  const address = readString(space.address);
  const latitude = asFiniteNumber(space.latitude);
  const longitude = asFiniteNumber(space.longitude);
  const pricePerNight = asFiniteNumber(space.price_per_night);
  const pricePerHour = asFiniteNumber(space.price_per_hour);
  const minHours = asFiniteNumber(space.min_hours);
  const acceptedPetTypes = Array.isArray(space.accepted_pet_types) ? space.accepted_pet_types : [];
  const photos = Array.isArray(space.photos) ? space.photos : [];
  return title.length > 0 && description.length > 0 && province.length > 0 && canton.length > 0 && address.length > 0 && Number.isFinite(latitude) && Number.isFinite(longitude) && pricePerNight > 0 && pricePerHour > 0 && minHours >= 1 && acceptedPetTypes.length > 0 && photos.length > 0;
}
async function listCaregiverSpaces(sub) {
  if (!sub) return [];
  const result = await ddb.send(new import_lib_dynamodb3.QueryCommand({
    TableName: CORE_TABLE_NAME,
    IndexName: "GSI2",
    KeyConditionExpression: "gsi2pk = :pk AND begins_with(gsi2sk, :prefix)",
    ExpressionAttributeValues: {
      ":pk": coreGsi.caregiverPk(sub),
      ":prefix": "SPACE#"
    }
  }));
  return result.Items ?? [];
}
function buildCaregiverStatus(profile, spaces = []) {
  const missingFields = getMissingCaregiverFields(profile);
  const profileComplete = missingFields.length === 0;
  const hasPublishableSpace = spaces.some((space) => isSpacePublishReady(space));
  return {
    profile_complete: profileComplete,
    operational_ready: profileComplete && hasPublishableSpace,
    missing_profile_fields: missingFields,
    has_publishable_space: hasPublishableSpace
  };
}
async function normalizeProfileWithStatus(item, fallbackRoles = ["owner"]) {
  const profile = normalizeProfileRecord(item, fallbackRoles);
  const spaces = profile.roles.includes("caregiver") ? await listCaregiverSpaces(String(profile.sub ?? "")) : [];
  return {
    ...profile,
    caregiver_status: buildCaregiverStatus(profile, spaces)
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

// lambda/handlers/update-profile/index.ts
async function handler(event) {
  try {
    const { sub } = getAuthClaims(event);
    const body = JSON.parse(event.body ?? "{}");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const existing = await ddb.send(new import_lib_dynamodb4.GetCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.userProfile(sub)
    }));
    if (!existing.Item) return notFound("Profile not found");
    const currentRoles = resolveProfileRoles(existing.Item);
    if (body.active_role !== void 0 && !currentRoles.includes(body.active_role)) {
      return badRequest("active_role must belong to the current user roles");
    }
    const exprParts = ["updated_at = :now"];
    const names = {};
    const values = { ":now": now };
    if (body.name !== void 0) {
      exprParts.push("#name = :name");
      names["#name"] = "name";
      values[":name"] = body.name;
    }
    if (body.bio !== void 0) {
      exprParts.push("bio = :bio");
      values[":bio"] = body.bio;
    }
    if (body.phone !== void 0) {
      exprParts.push("phone = :phone");
      values[":phone"] = body.phone;
    }
    if (body.avatar_url !== void 0) {
      exprParts.push("avatar_url = :avatar_url");
      values[":avatar_url"] = body.avatar_url;
    }
    if (body.province !== void 0) {
      exprParts.push("province = :province");
      values[":province"] = body.province;
    }
    if (body.canton !== void 0) {
      exprParts.push("canton = :canton");
      values[":canton"] = body.canton;
    }
    if (body.active_role !== void 0) {
      exprParts.push("active_role = :active_role");
      values[":active_role"] = body.active_role;
    }
    const result = await ddb.send(new import_lib_dynamodb4.UpdateCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.userProfile(sub),
      UpdateExpression: `SET ${exprParts.join(", ")}`,
      ExpressionAttributeNames: Object.keys(names).length ? names : void 0,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW"
    }));
    return ok(await normalizeProfileWithStatus(result.Attributes ?? {}, currentRoles.length ? currentRoles : ["owner"]));
  } catch (err) {
    return serverError(err);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
