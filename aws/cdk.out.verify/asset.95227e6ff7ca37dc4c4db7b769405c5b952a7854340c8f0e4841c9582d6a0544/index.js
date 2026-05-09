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

// lambda/handlers/list-spaces/index.ts
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
var coreGsi = {
  allSpacesPk: "ALL_SPACES",
  caregiverPk: (caregiverId) => `CAREGIVER#${caregiverId}`,
  ownerPk: (ownerId) => `OWNER#${ownerId}`,
  reviewerPk: (reviewerId) => `REVIEWER#${reviewerId}`
};

// lambda/shared/response.ts
var JSON_HEADERS = { "content-type": "application/json" };
var ok = (body) => ({
  statusCode: 200,
  headers: JSON_HEADERS,
  body: JSON.stringify(body)
});
var serverError = (err) => {
  console.error(err);
  return {
    statusCode: 500,
    headers: JSON_HEADERS,
    body: JSON.stringify({ error: "Internal server error" })
  };
};

// lambda/handlers/list-spaces/index.ts
async function handler(event) {
  try {
    const qs = event.queryStringParameters ?? {};
    const result = await ddb.send(new import_lib_dynamodb2.QueryCommand({
      TableName: CORE_TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "gsi1pk = :pk",
      ExpressionAttributeValues: { ":pk": coreGsi.allSpacesPk }
    }));
    let spaces = (result.Items ?? []).filter((s) => s["is_active"] === true);
    if (qs["province"]) spaces = spaces.filter((s) => s["province"] === qs["province"]);
    if (qs["canton"]) spaces = spaces.filter((s) => s["canton"] === qs["canton"]);
    if (qs["petType"]) spaces = spaces.filter((s) => Array.isArray(s["accepted_pet_types"]) && s["accepted_pet_types"].includes(qs["petType"]));
    return ok(spaces);
  } catch (err) {
    return serverError(err);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
