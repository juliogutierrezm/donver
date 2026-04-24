import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, BOOKINGS_TABLE_NAME, bookingKeys } from '../../shared/bookings-db';
import { getAuthClaims } from '../../shared/auth';
import { ok, forbidden, notFound, serverError } from '../../shared/response';

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

    const booking = result.Item;
    if (booking['owner_id'] !== sub && booking['caregiver_id'] !== sub) return forbidden();

    const now = new Date().toISOString();
    await ddb.send(new TransactWriteCommand({
      TransactItems: [
        {
          Update: {
            TableName: BOOKINGS_TABLE_NAME,
            Key: bookingKeys.booking(id),
            UpdateExpression: 'SET #status = :cancelled, updated_at = :now',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: { ':cancelled': 'cancelled', ':now': now },
          },
        },
        {
          Update: {
            TableName: BOOKINGS_TABLE_NAME,
            Key: { pk: bookingKeys.spacePk(booking['space_id'] as string), sk: bookingKeys.spaceBookingSk(booking['start_date'] as string, id) },
            UpdateExpression: 'SET #status = :cancelled',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: { ':cancelled': 'cancelled' },
          },
        },
      ],
    }));

    return ok({ ...booking, status: 'cancelled', updated_at: now });
  } catch (err) {
    return serverError(err);
  }
}
