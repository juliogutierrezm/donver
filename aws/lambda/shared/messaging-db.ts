import { ddb } from "./ddb-client";

export { ddb };

export const MESSAGING_TABLE_NAME = process.env["MESSAGING_TABLE_NAME"]!;

export const messagingKeys = {
  conversation: (id: string) => ({ pk: `CONV#${id}`, sk: "DETAIL" }),
  messageSk: (createdAtIso: string, id: string) => `MSG#${createdAtIso}#${id}`,
  messagePrefix: "MSG#",
  participantSk: (userId: string) => `PARTICIPANT#${userId}`,
  participantPrefix: "PARTICIPANT#",
  connection: (connectionId: string) => ({ pk: `CONN#${connectionId}`, sk: "CONNECTION" }),
  connectionPrefix: "CONN#",
};

export const messagingGsi = {
  userPk: (userId: string) => `USER#${userId}`,
};
