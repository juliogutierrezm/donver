import { ddb } from "./ddb-client";

export { ddb };

export const BOOKINGS_TABLE_NAME = process.env["BOOKINGS_TABLE_NAME"]!;

export const bookingKeys = {
  booking: (id: string) => ({ pk: `BOOKING#${id}`, sk: "DETAIL" }),
  spacePk: (spaceId: string) => `SPACE#${spaceId}`,
  blockedSk: (date: string) => `BLOCKED#${date}`,
  blockedPrefix: "BLOCKED#",
  spaceBookingSk: (startDate: string, bookingId: string) => `BOOKING#${startDate}#${bookingId}`,
  spaceBookingPrefix: "BOOKING#",
};

export const bookingsGsi = {
  ownerPk: (ownerId: string) => `OWNER#${ownerId}`,
  caregiverPk: (caregiverId: string) => `CAREGIVER#${caregiverId}`,
};
