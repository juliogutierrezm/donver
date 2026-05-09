import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, BOOKINGS_TABLE_NAME, bookingKeys } from '../../shared/bookings-db';
import { getAuthClaims } from '../../shared/auth';
import { badRequest, forbidden, notFound, ok, serverError } from '../../shared/response';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);
    const id = event.pathParameters?.['id'];
    if (!id) return notFound('Booking not found');

    const result = await ddb.send(new GetCommand({
      TableName: BOOKINGS_TABLE_NAME,
      Key: bookingKeys.booking(id),
    }));
    if (!result.Item) return notFound('Booking not found');

    const booking = result.Item as Record<string, unknown>;
    if (booking['caregiver_id'] !== sub) {
      return forbidden('Only the caregiver can confirm this booking');
    }
    if (booking['status'] !== 'pending') {
      return badRequest('Only pending bookings can be confirmed');
    }

    const now = new Date().toISOString();
    await ddb.send(new TransactWriteCommand({
      TransactItems: [
        {
          Update: {
            TableName: BOOKINGS_TABLE_NAME,
            Key: bookingKeys.booking(id),
            UpdateExpression: 'SET #status = :confirmed, updated_at = :now',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: { ':confirmed': 'confirmed', ':now': now },
          },
        },
        {
          Update: {
            TableName: BOOKINGS_TABLE_NAME,
            Key: {
              pk: bookingKeys.spacePk(String(booking['space_id'] ?? '')),
              sk: bookingKeys.spaceBookingSk(String(booking['start_date'] ?? ''), id),
            },
            UpdateExpression: 'SET #status = :confirmed',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: { ':confirmed': 'confirmed' },
          },
        },
      ],
    }));

    return ok({ ...booking, status: 'confirmed', updated_at: now });
  } catch (error) {
    return serverError(error);
  }
}
