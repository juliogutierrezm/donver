import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

type Domain = "core" | "bookings" | "messaging" | "skip";

const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i += 1) {
  const token = process.argv[i];
  if (!token.startsWith("--")) continue;
  const key = token.slice(2);
  const next = process.argv[i + 1];
  if (!next || next.startsWith("--")) {
    args.set(key, "true");
    continue;
  }
  args.set(key, next);
  i += 1;
}

const envName = args.get("env");
if (envName !== "dev" && envName !== "prod") {
  throw new Error("Debes indicar --env dev o --env prod.");
}

const dryRun = args.get("dry-run") === "true";
const region = process.env.AWS_REGION || "us-east-1";
const sourceTable = `donver-main-${envName}`;
const coreTable = `donver-core-${envName}`;
const bookingsTable = `donver-bookings-${envName}`;
const messagingTable = `donver-messaging-${envName}`;

const client = new DynamoDBClient({ region });
const ddb = DynamoDBDocumentClient.from(client);

const counters = {
  scanned: 0,
  core: 0,
  bookings: 0,
  messaging: 0,
  skipped: 0,
  duplicates: 0,
};

function classifyItem(item: Record<string, unknown>): Domain {
  const pk = String(item.pk ?? "");
  const sk = String(item.sk ?? "");

  if (pk.startsWith("USER#") || pk.startsWith("PET#")) return "core";
  if (pk.startsWith("BOOKING#")) return "bookings";
  if (pk.startsWith("CONV#") || pk.startsWith("CONN#")) return "messaging";

  if (pk.startsWith("SPACE#")) {
    if (sk === "DETAIL") return "core";
    if (sk.startsWith("REVIEW#")) return "core";
    if (sk.startsWith("BLOCKED#")) return "bookings";
    if (sk.startsWith("BOOKING#")) return "bookings";
  }

  return "skip";
}

function resolveTargetTable(domain: Exclude<Domain, "skip">) {
  if (domain === "core") return coreTable;
  if (domain === "bookings") return bookingsTable;
  return messagingTable;
}

async function copyItem(item: Record<string, unknown>) {
  const domain = classifyItem(item);
  counters.scanned += 1;

  if (domain === "skip") {
    counters.skipped += 1;
    return;
  }

  const targetTable = resolveTargetTable(domain);
  if (dryRun) {
    counters[domain] += 1;
    return;
  }

  try {
    await ddb.send(
      new PutCommand({
        TableName: targetTable,
        Item: item,
        ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)",
      })
    );
    counters[domain] += 1;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "ConditionalCheckFailedException"
    ) {
      counters.duplicates += 1;
      return;
    }
    throw error;
  }
}

async function run() {
  let lastEvaluatedKey: Record<string, unknown> | undefined;

  do {
    const page = await ddb.send(
      new ScanCommand({
        TableName: sourceTable,
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    for (const item of page.Items ?? []) {
      await copyItem(item as Record<string, unknown>);
    }

    lastEvaluatedKey = page.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastEvaluatedKey);

  console.log(
    JSON.stringify(
      {
        env: envName,
        dryRun,
        sourceTable,
        coreTable,
        bookingsTable,
        messagingTable,
        counters,
      },
      null,
      2
    )
  );
}

void run();
