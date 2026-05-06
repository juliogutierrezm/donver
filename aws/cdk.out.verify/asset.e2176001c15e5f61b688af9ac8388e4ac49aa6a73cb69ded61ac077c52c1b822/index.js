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

// lambda/handlers/auth-register/index.ts
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
var coreGsi = {
  allSpacesPk: "ALL_SPACES",
  caregiverPk: (caregiverId) => `CAREGIVER#${caregiverId}`,
  ownerPk: (ownerId) => `OWNER#${ownerId}`,
  reviewerPk: (reviewerId) => `REVIEWER#${reviewerId}`
};

// lambda/shared/profile.ts
var import_lib_dynamodb3 = require("@aws-sdk/lib-dynamodb");

// lambda/shared/auth.ts
var import_lib_dynamodb2 = require("@aws-sdk/lib-dynamodb");
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

// lambda/shared/profile.ts
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
  const legacyRole = typeof item.role === "string" ? [item.role] : [];
  const roles = normalizeRoles(item.roles ?? legacyRole);
  const nextRoles = roles.length ? roles : signupIntent === "caregiver" ? [] : fallbackRoles;
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
var conflict = (msg) => ({
  statusCode: 409,
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

// lambda/handlers/auth-register/index.ts
function getCognitoErrorCode(payload) {
  const rawCode = typeof payload?.__type === "string" && payload.__type || typeof payload?.code === "string" && payload.code || typeof payload?.Code === "string" && payload.Code || "";
  return rawCode.includes("#") ? rawCode.split("#").pop() : rawCode;
}
function translateCognitoError(code, fallback) {
  switch (code) {
    case "UsernameExistsException":
      return { kind: "conflict", message: "Ya existe una cuenta con ese correo." };
    case "InvalidPasswordException":
      return { kind: "badRequest", message: fallback ?? "La contrasena no cumple los requisitos." };
    default:
      return { kind: "badRequest", message: fallback ?? "No se pudo crear la cuenta en Cognito." };
  }
}
async function signUpWithCognito(body) {
  const region = process.env["AWS_REGION"] ?? process.env["AWS_DEFAULT_REGION"] ?? "us-east-1";
  const clientId = process.env["COGNITO_USER_POOL_CLIENT_ID"];
  if (!clientId) throw new Error("COGNITO_USER_POOL_CLIENT_ID is not configured");
  const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": "AWSCognitoIdentityProviderService.SignUp"
    },
    body: JSON.stringify({
      ClientId: clientId,
      Username: body.email,
      Password: body.password,
      UserAttributes: [
        { Name: "email", Value: body.email },
        { Name: "name", Value: body.name }
      ]
    })
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const code = getCognitoErrorCode(json);
    const fallback = typeof json?.message === "string" ? json.message : typeof json?.Message === "string" ? json.Message : `Error Cognito ${response.status}`;
    return translateCognitoError(code, fallback);
  }
  return json;
}
async function handler(event) {
  try {
    const body = JSON.parse(event.body ?? "{}");
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const phone = body.phone?.trim() ?? "";
    const province = body.province?.trim();
    const canton = body.canton?.trim();
    const signupIntent = body.signup_intent === "caregiver" ? "caregiver" : null;
    if (!name || !email || !password || !province || !canton) {
      return badRequest("name, email, password, province and canton are required");
    }
    const signUpResult = await signUpWithCognito({
      name,
      email,
      password,
      phone,
      province,
      canton,
      signup_intent: signupIntent ?? void 0
    });
    if ("kind" in signUpResult) {
      return signUpResult.kind === "conflict" ? conflict(signUpResult.message) : badRequest(signUpResult.message);
    }
    if (!signUpResult.UserSub) {
      return serverError(new Error("Cognito did not return UserSub"));
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const initialRoles = signupIntent === "caregiver" ? [] : ["owner"];
    const initialActiveRole = signupIntent === "caregiver" ? "caregiver" : "owner";
    const profile = {
      pk: `USER#${signUpResult.UserSub}`,
      sk: "PROFILE",
      sub: signUpResult.UserSub,
      email,
      name,
      phone,
      province,
      canton,
      roles: initialRoles,
      active_role: initialActiveRole,
      bio: "",
      avatar_url: "",
      signup_intent: signupIntent,
      created_at: now,
      updated_at: now
    };
    await ddb.send(new import_lib_dynamodb4.PutCommand({
      TableName: CORE_TABLE_NAME,
      Item: profile,
      ConditionExpression: "attribute_not_exists(pk)"
    }));
    return created({
      confirmed: Boolean(signUpResult.UserConfirmed),
      user: await normalizeProfileWithStatus(profile, initialRoles)
    });
  } catch (err) {
    return serverError(err);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
