import { ddb } from "./ddb-client";

export { ddb };

export const CORE_TABLE_NAME = process.env["CORE_TABLE_NAME"]!;

export const coreKeys = {
  userProfile: (sub: string) => ({ pk: `USER#${sub}`, sk: "PROFILE" }),
  space: (id: string) => ({ pk: `SPACE#${id}`, sk: "DETAIL" }),
  pet: (id: string) => ({ pk: `PET#${id}`, sk: "DETAIL" }),
  reviewPk: (spaceId: string) => `SPACE#${spaceId}`,
  reviewSk: (createdAtIso: string, id: string) => `REVIEW#${createdAtIso}#${id}`,
  reviewPrefix: "REVIEW#",
};

export const coreGsi = {
  allSpacesPk: "ALL_SPACES",
  caregiverPk: (caregiverId: string) => `CAREGIVER#${caregiverId}`,
  ownerPk: (ownerId: string) => `OWNER#${ownerId}`,
  reviewerPk: (reviewerId: string) => `REVIEWER#${reviewerId}`,
};
