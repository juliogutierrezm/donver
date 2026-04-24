import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand, QueryCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, CORE_TABLE_NAME, coreKeys, coreGsi } from '../../shared/core-db';
import { BOOKINGS_TABLE_NAME, bookingKeys } from '../../shared/bookings-db';
import { getAuthClaims } from '../../shared/auth';
import { created, badRequest, notFound, serverError } from '../../shared/response';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);
    const spaceId = event.pathParameters?.['id'];
    if (!spaceId) return notFound('Space not found');

    const body = JSON.parse(event.body ?? '{}') as {
      booking_id?: string; rating?: number; comment?: string;
    };
    if (!body.booking_id || body.rating === undefined) return badRequest('booking_id and rating required');
    if (body.rating < 1 || body.rating > 5) return badRequest('rating must be between 1 and 5');

    // Check duplicate review
    const dupCheck = await ddb.send(new QueryCommand({
      TableName: CORE_TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'gsi1pk = :pk AND gsi1sk = :sk',
      ExpressionAttributeValues: { ':pk': coreGsi.reviewerPk(sub), ':sk': `REVIEW#${spaceId}` },
    }));
    if ((dupCheck.Items ?? []).length > 0) return badRequest('Already reviewed this space');

    // Verify completed booking
    const bookingResult = await ddb.send(new GetCommand({
      TableName: BOOKINGS_TABLE_NAME,
      Key: bookingKeys.booking(body.booking_id),
    }));
    if (!bookingResult.Item) return badRequest('Booking not found');
    const bk = bookingResult.Item;
    if (bk['status'] !== 'completed' || bk['owner_id'] !== sub || bk['space_id'] !== spaceId) {
      return badRequest('Invalid booking for this review');
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
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
      comment: body.comment ?? '',
      created_at: now,
    };
    await ddb.send(new PutCommand({ TableName: CORE_TABLE_NAME, Item: review }));

    // Recalculate space rating
    const allReviews = await ddb.send(new QueryCommand({
      TableName: CORE_TABLE_NAME,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: { ':pk': coreKeys.reviewPk(spaceId), ':prefix': coreKeys.reviewPrefix },
    }));
    const reviews = allReviews.Items ?? [];
    const count = reviews.length;
    const avg = count > 0 ? reviews.reduce((sum, r) => sum + (r['rating'] as number), 0) / count : 0;
    const rounded = Math.round(avg * 10) / 10;

    await ddb.send(new UpdateCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.space(spaceId),
      UpdateExpression: 'SET rating = :rating, review_count = :count',
      ExpressionAttributeValues: { ':rating': rounded, ':count': count },
    }));

    return created(review);
  } catch (err) {
    return serverError(err);
  }
}
