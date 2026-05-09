# Donver — AWS Serverless / CDK Rules

<!-- applyTo: "aws/**/*.{ts,js}" -->

Rules for all infrastructure and backend work in `aws/`. These apply to CDK stacks, Lambda handlers, DynamoDB, Cognito, S3, IAM, and API Gateway.

---

## Stack summary

| Service | Purpose |
|---------|---------|
| AWS CDK (TypeScript) | All infrastructure as code |
| AWS Lambda (TypeScript) | Business logic handlers |
| Amazon DynamoDB | Primary data store (Core + domain tables) |
| Amazon Cognito | User authentication (User Pool + Identity Pool) |
| Amazon S3 | Media / asset uploads via pre-signed URLs |
| API Gateway (HTTP API) | REST-like endpoint layer |
| CloudWatch Logs | Observability — always check here before guessing |

---

## CDK rules

- **All infrastructure must be defined in CDK** — never create resources manually in the AWS Console unless the user explicitly asks.
- Do not hardcode production ARNs, account IDs, or region strings inside stack definitions.
- Use CDK context (`cdk.context.json`) or environment variables for environment-specific values.
- After any CDK change, run:
  ```bash
  cd aws && npx cdk synth
  ```
  It must exit 0 before proceeding.
- **Never run `cdk deploy` without explicit user confirmation.**
- Keep stacks separated by domain: `auth-stack.ts`, `data-stack.ts`, `api-stack.ts`, `shared-stack.ts`.

---

## IAM — least privilege

- Grant each Lambda only the permissions it actually needs for its specific table/operation.
- Examples:
  - A Lambda that reads Core table → `GetItem` or `Query` on Core only.
  - A Lambda that writes Bookings → `PutItem` / `UpdateItem` on Bookings only.
- Do not use `AmazonDynamoDBFullAccess` or `AdministratorAccess` for Lambda execution roles.
- Do not use wildcard `*` resources in Lambda IAM policies unless scope makes it unavoidable and it is explicitly documented.

---

## Lambda rules

- One handler per folder under `aws/lambda/handlers/`.
- Shared utilities live in `aws/lambda/shared/` — reuse, do not duplicate.
- Validate **role and ownership** in Lambda, not just in the frontend:
  - Check that the authenticated user (from Cognito claims) matches the owner/caregiver they claim to be.
  - Check that a caregiver cannot book their own space.
- Return controlled error responses with correct HTTP status codes and CORS headers — never let unhandled exceptions reach the API consumer as opaque 500s.
- Check CloudWatch logs for the relevant Lambda **before** guessing the cause of a 500 error.

---

## API Gateway rules

- All endpoints must return CORS headers on both success and error responses.
- Error responses must be JSON with a human-readable `message` field — never expose stack traces or DynamoDB error objects.
- Do not expose internal IDs, Cognito sub values, or DynamoDB key schemas in API responses destined for the frontend.

---

## DynamoDB rules

- Do not scan tables in production queries — use `Query` with proper key conditions.
- When adding a new access pattern, consider whether a GSI is needed before writing a Scan.
- Document new GSIs in the stack file with a comment explaining the access pattern.
- Backfill scripts live in `aws/scripts/` — treat them as one-time operations, not recurring jobs.

---

## S3 / media uploads

- Use **pre-signed URLs** for all client uploads — never expose AWS credentials to the browser.
- After a successful upload, store the `avatarKey` or `mediaKey` in the relevant DynamoDB record.
- Keep bucket policies private — no public-read ACLs unless explicitly required and approved.

---

## Cognito rules

- User attributes (name, email, role) come from Cognito claims in the Lambda's `event.requestContext.authorizer.jwt`.
- Do not re-query Cognito for attributes that are already in the token.
- Role changes that affect authorisation (e.g., promoting to caregiver) must be reflected in both Cognito custom attributes and the DynamoDB profile record.

---

## Debugging checklist (backend)

1. Check **CloudWatch Logs** for the Lambda function first.
2. Verify the **API Gateway access log** for the request/response.
3. Check that the **Cognito JWT** is valid and includes the expected claims.
4. Verify DynamoDB **item exists** with the expected key before assuming a Lambda bug.
5. Confirm **CORS headers** are present on error responses as well as success responses.
6. Run `cdk synth` to confirm infrastructure matches expectations before deploying.

---

## Deployment safety

- Never run `cdk deploy` autonomously.
- Never commit `.env` files, AWS credentials, or secrets to the repository.
- Use AWS Secrets Manager or SSM Parameter Store for secrets consumed by Lambda.
- The `.mcp.json` file in the repo root configures MCP access — do not add secrets to it.
