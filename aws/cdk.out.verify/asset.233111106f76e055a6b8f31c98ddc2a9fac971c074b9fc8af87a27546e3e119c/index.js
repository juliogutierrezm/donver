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

// lambda/handlers/create-review/index.ts
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
var coreGsi = {
  allSpacesPk: "ALL_SPACES",
  caregiverPk: (caregiverId) => `CAREGIVER#${caregiverId}`,
  ownerPk: (ownerId) => `OWNER#${ownerId}`,
  reviewerPk: (reviewerId) => `REVIEWER#${reviewerId}`
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

// lambda/handlers/create-review/index.ts
async function handler(event) {
  try {
    const { sub } = getAuthClaims(event);
    const spaceId = event.pathParameters?.["id"];
    if (!spaceId) return notFound("Space not found");
    const body = JSON.parse(event.body ?? "{}");
    if (!body.booking_id || body.rating === void 0) return badRequest("booking_id and rating required");
    if (body.rating < 1 || body.rating > 5) return badRequest("rating must be between 1 and 5");
    const dupCheck = await ddb.send(new import_lib_dynamodb3.QueryCommand({
      TableName: CORE_TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "gsi1pk = :pk AND gsi1sk = :sk",
      ExpressionAttributeValues: { ":pk": coreGsi.reviewerPk(sub), ":sk": `REVIEW#${spaceId}` }
    }));
    if ((dupCheck.Items ?? []).length > 0) return badRequest("Already reviewed this space");
    const bookingResult = await ddb.send(new import_lib_dynamodb3.GetCommand({
      TableName: BOOKINGS_TABLE_NAME,
      Key: bookingKeys.booking(body.booking_id)
    }));
    if (!bookingResult.Item) return badRequest("Booking not found");
    const bk = bookingResult.Item;
    if (bk["status"] !== "completed" || bk["owner_id"] !== sub || bk["space_id"] !== spaceId) {
      return badRequest("Invalid booking for this review");
    }
    const id = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const review = {
      pk: coreKeys.reviewPk(spaceId),
      sk: coreKeys.reviewSk(now, id),
      gsi1pk: coreGsi.reviewerPk(sub),
      gsi1sk: `REVIEW#${spaceId}`,
      id,
      space_id: spaceId,
      reviewer_id: sub,
      booking_id: body.booking_id,
      rating: body.rating,
      comment: body.comment ?? "",
      created_at: now
    };
    await ddb.send(new import_lib_dynamodb3.PutCommand({ TableName: CORE_TABLE_NAME, Item: review }));
    const allReviews = await ddb.send(new import_lib_dynamodb3.QueryCommand({
      TableName: CORE_TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: { ":pk": coreKeys.reviewPk(spaceId), ":prefix": coreKeys.reviewPrefix }
    }));
    const reviews = allReviews.Items ?? [];
    const count = reviews.length;
    const avg = count > 0 ? reviews.reduce((sum, r) => sum + r["rating"], 0) / count : 0;
    const rounded = Math.round(avg * 10) / 10;
    await ddb.send(new import_lib_dynamodb3.UpdateCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.space(spaceId),
      UpdateExpression: "SET rating = :rating, review_count = :count",
      ExpressionAttributeValues: { ":rating": rounded, ":count": count }
    }));
    return created(review);
  } catch (err) {
    return serverError(err);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
