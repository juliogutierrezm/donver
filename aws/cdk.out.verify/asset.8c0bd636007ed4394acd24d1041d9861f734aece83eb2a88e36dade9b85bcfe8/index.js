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

// lambda/handlers/create-upload-url/index.ts
var index_exports = {};
__export(index_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(index_exports);

// lambda/shared/auth.ts
var import_lib_dynamodb2 = require("@aws-sdk/lib-dynamodb");

// lambda/shared/ddb-client.ts
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var client = new import_client_dynamodb.DynamoDBClient({});
var ddb = import_lib_dynamodb.DynamoDBDocumentClient.from(client);

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
var serverError = (err) => {
  console.error(err);
  return {
    statusCode: 500,
    headers: JSON_HEADERS,
    body: JSON.stringify({ error: "Internal server error" })
  };
};

// lambda/handlers/create-upload-url/index.ts
var import_client_s3 = require("@aws-sdk/client-s3");
var import_s3_request_presigner = require("@aws-sdk/s3-request-presigner");
var import_crypto = require("crypto");
var s3 = new import_client_s3.S3Client({});
async function handler(event) {
  try {
    const { sub } = getAuthClaims(event);
    const body = JSON.parse(event.body ?? "{}");
    const category = body.category === "pet" ? "pet" : "space";
    const bucket = category === "pet" ? process.env["PET_PHOTOS_BUCKET"] : process.env["SPACE_PHOTOS_BUCKET"];
    const contentType = body.contentType ?? "image/jpeg";
    if (!["image/jpeg", "image/png", "image/webp"].includes(contentType))
      return badRequest("Invalid content type");
    const key = `${sub}/${(0, import_crypto.randomUUID)()}.${contentType.split("/")[1]}`;
    const command = new import_client_s3.PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
    const url = await (0, import_s3_request_presigner.getSignedUrl)(s3, command, { expiresIn: 300 });
    const region = process.env["AWS_REGION"] ?? process.env["AWS_DEFAULT_REGION"] ?? "us-east-1";
    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    return ok({ url, key, publicUrl });
  } catch (err) {
    return serverError(err);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
