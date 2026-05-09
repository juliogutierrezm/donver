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

// lambda/handlers/update-pet/index.ts
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

// lambda/handlers/update-pet/index.ts
async function handler(event) {
  try {
    const { sub } = getAuthClaims(event);
    if (!await userHasRole(sub, "owner")) {
      return forbidden("No tienes perfil de due\xF1o activo.");
    }
    const id = event.pathParameters?.["id"];
    if (!id) return notFound("Pet not found");
    const existing = await ddb.send(new import_lib_dynamodb3.GetCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.pet(id)
    }));
    if (!existing.Item) return notFound("Pet not found");
    if (existing.Item["owner_id"] !== sub) return forbidden();
    const body = JSON.parse(event.body ?? "{}");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const allowed = ["name", "species", "breed", "age", "weight", "size", "description", "photos", "medical_notes"];
    const exprParts = ["updated_at = :now"];
    const names = {};
    const values = { ":now": now };
    for (const key of allowed) {
      if (body[key] !== void 0) {
        const safe = key === "name" ? "#name" : `#${key}`;
        exprParts.push(`${safe} = :${key}`);
        names[safe] = key;
        values[`:${key}`] = body[key];
      }
    }
    const result = await ddb.send(new import_lib_dynamodb3.UpdateCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.pet(id),
      UpdateExpression: `SET ${exprParts.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW"
    }));
    return ok(result.Attributes);
  } catch (err) {
    return serverError(err);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
