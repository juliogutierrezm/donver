import * as cdk from "aws-cdk-lib";
import { DonverSharedStack } from "../lib/shared-stack.js";
import { DonverAuthStack } from "../lib/auth-stack.js";
import { DonverDataStack } from "../lib/data-stack.js";
import { DonverApiStack } from "../lib/api-stack.js";

const app = new cdk.App();
const account =
  process.env.CDK_DEFAULT_ACCOUNT ??
  process.env.AWS_ACCOUNT_ID ??
  "111111111111";
const region = "us-east-1";

const environments = ["dev", "prod"] as const;

for (const envName of environments) {
  const stackSuffix = envName;
  const stackEnv = { account, region };

  const shared = new DonverSharedStack(app, `DonverShared-${stackSuffix}`, {
    env: stackEnv,
    envName,
    description: `Donver shared resources (${envName})`,
  });

  const auth = new DonverAuthStack(app, `DonverAuth-${stackSuffix}`, {
    env: stackEnv,
    envName,
    description: `Donver auth resources (${envName})`,
  });
  auth.addDependency(shared);

  const data = new DonverDataStack(app, `DonverData-${stackSuffix}`, {
    env: stackEnv,
    envName,
    description: `Donver data resources (${envName})`,
  });
  data.addDependency(shared);

  const api = new DonverApiStack(app, `DonverApi-${stackSuffix}`, {
    env: stackEnv,
    envName,
    userPool: auth.userPool,
    userPoolClient: auth.userPoolClient,
    spacePhotosBucket: shared.spacePhotosBucket,
    petPhotosBucket: shared.petPhotosBucket,
    description: `Donver API resources (${envName})`,
  });
  api.addDependency(auth);
  api.addDependency(data);
}
