import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand, QueryCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, CORE_TABLE_NAME, coreKeys } from '../../shared/core-db';
import { BOOKINGS_TABLE_NAME, bookingKeys, bookingsGsi } from '../../shared/bookings-db';
import { getAuthClaims, userHasRole } from '../../shared/auth';
import { calculateBookingPricing, DEFAULT_ADDITIONAL_PET_RATE } from '../../shared/booking-pricing';
import { created, badRequest, forbidden, notFound, serverError } from '../../shared/response';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const { sub } = getAuthClaims(event);
    if (!(await userHasRole(sub, 'owner'))) {
      return forbidden('No tienes perfil de dueño activo.');
    }
    const body = JSON.parse(event.body ?? '{}') as {
      space_id?: string; pet_ids?: string[]; booking_type?: string;
      start_date?: string; end_date?: string; start_time?: string; end_time?: string;
      hours?: number; subtotal?: number; notes?: string;
    };

    if (!body.space_id || !body.start_date || !body.end_date || body.subtotal === undefined) {
      return badRequest('space_id, start_date, end_date, subtotal required');
    }
    const petIds = Array.isArray(body.pet_ids) ? Array.from(new Set(body.pet_ids.map(String))) : [];
    if (petIds.length === 0) {
      return badRequest('Select at least one pet for the booking');
    }

    const spaceResult = await ddb.send(new GetCommand({
      TableName: CORE_TABLE_NAME,
      Key: coreKeys.space(body.space_id),
    }));
    if (!spaceResult.Item) return notFound('Space not found');
    const space = spaceResult.Item as Record<string, unknown>;
    const caregiverId = String(space['caregiver_id'] ?? '');
    if (caregiverId && caregiverId === sub) {
      return forbidden('No puedes reservar tu propio espacio.');
    }
    const maxPets = Number(space['max_pets'] ?? 1);
    if (petIds.length > maxPets) {
      return badRequest(`Este espacio permite máximo ${maxPets} mascotas por reserva.`);
    }

    // Check blocked dates
    const blockedResult = await ddb.send(new QueryCommand({
      TableName: BOOKINGS_TABLE_NAME,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: { ':pk': bookingKeys.spacePk(body.space_id), ':prefix': bookingKeys.blockedPrefix },
    }));
    for (const bd of blockedResult.Items ?? []) {
      const d = bd['date'] as string;
      if (d >= body.start_date && d <= body.end_date) {
        return badRequest('Selected dates are blocked');
      }
    }

    // Check booking overlap
    const existingBookings = await ddb.send(new QueryCommand({
      TableName: BOOKINGS_TABLE_NAME,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: { ':pk': bookingKeys.spacePk(body.space_id), ':prefix': bookingKeys.spaceBookingPrefix },
    }));
    for (const bk of existingBookings.Items ?? []) {
      if (bk['status'] === 'cancelled') continue;
      const bkStart = bk['start_date'] as string;
      const bkEnd = bk['end_date'] as string;
      if (bkStart <= body.end_date && bkEnd >= body.start_date) {
        return badRequest('Selected dates are already booked');
      }
    }

    const pricing = calculateBookingPricing({
      bookingType: body.booking_type ?? 'overnight',
      startDate: body.start_date,
      endDate: body.end_date,
      pricePerNight: Number(space['price_per_night'] ?? 0),
      pricePerHour: Number(space['price_per_hour'] ?? 0),
      hours: body.hours,
      petCount: petIds.length,
      additionalPetRate:
        typeof space['additional_pet_rate'] === 'number'
          ? (space['additional_pet_rate'] as number)
          : DEFAULT_ADDITIONAL_PET_RATE,
    });
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await ddb.send(new TransactWriteCommand({
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
              booking_type: body.booking_type ?? 'overnight',
              start_date: body.start_date,
              end_date: body.end_date,
              start_time: body.start_time ?? '',
              end_time: body.end_time ?? '',
              hours: body.hours ?? 0,
              subtotal: pricing.subtotal,
              service_fee: pricing.serviceFee,
              total_price: pricing.totalPrice,
              status: 'pending',
              notes: body.notes ?? '',
              created_at: now,
              updated_at: now,
            },
          },
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
              status: 'pending',
            },
          },
        },
      ],
    }));

    return created({ id, space_id: body.space_id, owner_id: sub, caregiver_id: caregiverId,
      pet_ids: petIds, booking_type: body.booking_type ?? 'overnight',
      start_date: body.start_date, end_date: body.end_date, start_time: body.start_time ?? '',
      end_time: body.end_time ?? '', hours: body.hours ?? 0, subtotal: pricing.subtotal,
      service_fee: pricing.serviceFee, total_price: pricing.totalPrice, status: 'pending', notes: body.notes ?? '',
      created_at: now, updated_at: now });
  } catch (err) {
    return serverError(err);
  }
}
