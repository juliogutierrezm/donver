import { ddb } from "./ddb-client";

export { ddb };
export const TABLE_NAME = process.env["TABLE_NAME"]!;

export const keys = {
	space: (id: string) => ({ pk: `SPACE#${id}`, sk: "DETAIL" }),
	booking: (id: string) => ({ pk: `BOOKING#${id}`, sk: "DETAIL" }),
	pet: (id: string) => ({ pk: `PET#${id}`, sk: "DETAIL" }),
	conversation: (id: string) => ({ pk: `CONV#${id}`, sk: "DETAIL" }),
	messageSk: (createdAtIso: string, id: string) => `MSG#${createdAtIso}#${id}`,
	messagePrefix: "MSG#",
	participantSk: (userId: string) => `PARTICIPANT#${userId}`,
	participantPrefix: "PARTICIPANT#",
	connection: (connectionId: string) => ({ pk: `CONN#${connectionId}`, sk: "CONNECTION" }),
	connectionPrefix: "CONN#",
};

export const gsi = {
	allSpacesPk: "ALL_SPACES",
	ownerPk: (ownerId: string) => `OWNER#${ownerId}`,
	caregiverPk: (caregiverId: string) => `CAREGIVER#${caregiverId}`,
	userPk: (userId: string) => `USER#${userId}`,
	reviewerPk: (reviewerId: string) => `REVIEWER#${reviewerId}`,
};
