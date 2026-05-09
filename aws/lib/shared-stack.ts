import * as cdk from "aws-cdk-lib";
import { Duration, RemovalPolicy } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as ssm from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";

export interface DonverSharedStackProps extends cdk.StackProps {
  envName: "dev" | "prod";
}

export class DonverSharedStack extends cdk.Stack {
  public readonly spacePhotosBucket: s3.Bucket;
  public readonly petPhotosBucket: s3.Bucket;
  public readonly deployRole: iam.Role;

  constructor(scope: Construct, id: string, props: DonverSharedStackProps) {
    super(scope, id, props);

    const bucketCors: s3.CorsRule[] = [
      {
        allowedHeaders: ["*"],
        allowedMethods: [
          s3.HttpMethods.GET,
          s3.HttpMethods.HEAD,
          s3.HttpMethods.PUT,
        ],
        allowedOrigins: [
          "http://localhost:5173",
          "http://localhost:4173",
          "http://127.0.0.1:5173",
          "http://127.0.0.1:4173",
          "https://donver.vercel.app",
          "https://app.donver.cr",
        ],
        exposedHeaders: ["ETag", "x-amz-request-id", "x-amz-id-2"],
        maxAge: 3600,
      },
    ];

    this.spacePhotosBucket = new s3.Bucket(this, "SpacePhotosBucket", {
      bucketName: `donver-space-photos-${props.envName}-${cdk.Aws.ACCOUNT_ID}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      cors: bucketCors,
      publicReadAccess: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    this.petPhotosBucket = new s3.Bucket(this, "PetPhotosBucket", {
      bucketName: `donver-pet-photos-${props.envName}-${cdk.Aws.ACCOUNT_ID}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      cors: bucketCors,
      publicReadAccess: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const stripeSecret = new ssm.StringParameter(this, "StripeSecretKeyParameter", {
      parameterName: `/donver/${props.envName}/stripe-secret-key`,
      stringValue: "REPLACE_ME",
      description: "Placeholder Stripe secret key for Donver",
    });

    const googleOAuthClientId = new ssm.StringParameter(this, "GoogleOAuthClientIdParameter", {
      parameterName: `/donver/${props.envName}/google-oauth-client-id`,
      stringValue: "REPLACE_ME",
      description: "Placeholder Google OAuth client ID for Donver",
    });

    const deployPolicy = new iam.ManagedPolicy(this, "DonverDeployPolicy", {
      managedPolicyName: `DonverDeployPolicy-${props.envName}`,
      description: "Create and update Donver resources without delete permissions",
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "cloudformation:Create*",
            "cloudformation:Update*",
            "cloudformation:Describe*",
            "cloudformation:List*",
            "cloudformation:Get*",
            "dynamodb:CreateTable",
            "dynamodb:UpdateTable",
            "dynamodb:DescribeTable",
            "dynamodb:ListTables",
            "dynamodb:TagResource",
            "dynamodb:UntagResource",
            "dynamodb:ListTagsOfResource",
            "dynamodb:PutItem",
            "dynamodb:GetItem",
            "dynamodb:UpdateItem",
            "dynamodb:DeleteItem",
            "dynamodb:Query",
            "dynamodb:Scan",
            "dynamodb:BatchGetItem",
            "dynamodb:BatchWriteItem",
            "dynamodb:TransactWriteItems",
            "dynamodb:TransactGetItems",
            "s3:Create*",
            "s3:Put*",
            "s3:Get*",
            "s3:List*",
            "s3:Head*",
            "s3:Tag*",
            "ssm:PutParameter",
            "ssm:GetParameter",
            "ssm:GetParameters",
            "secretsmanager:CreateSecret",
            "secretsmanager:DescribeSecret",
            "secretsmanager:GetSecretValue",
            "secretsmanager:PutSecretValue",
            "iam:CreateRole",
            "iam:PutRolePolicy",
            "iam:AttachRolePolicy",
            "iam:PassRole",
            "iam:GetRole",
            "iam:List*",
            "cognito-idp:Create*",
            "cognito-idp:Update*",
            "cognito-idp:Describe*",
            "lambda:Create*",
            "lambda:Update*",
            "lambda:Publish*",
            "lambda:Get*",
            "lambda:List*",
            "apigateway:*",
            "logs:Create*",
            "logs:Put*",
            "logs:Describe*",
          ],
          resources: ["*"],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: [
            "cloudformation:Delete*",
            "s3:Delete*",
            "ssm:Delete*",
            "secretsmanager:Delete*",
            "iam:Delete*",
            "cognito-idp:Delete*",
            "lambda:Delete*",
            "apigateway:Delete*",
            "logs:Delete*",
            "dynamodb:DeleteTable",
          ],
          resources: ["*"],
        }),
      ],
    });

    this.deployRole = new iam.Role(this, "DonverDeployRole", {
      roleName: `donver-deploy-role-${props.envName}`,
      assumedBy: new iam.AccountPrincipal(cdk.Stack.of(this).account),
      description: "Deployment role for Donver with create/update-only permissions",
      maxSessionDuration: Duration.hours(1),
    });

    this.deployRole.addManagedPolicy(deployPolicy);

    new cdk.CfnOutput(this, "SpacePhotosBucketName", {
      value: this.spacePhotosBucket.bucketName,
    });

    new cdk.CfnOutput(this, "PetPhotosBucketName", {
      value: this.petPhotosBucket.bucketName,
    });

    new cdk.CfnOutput(this, "StripeSecretParameterName", {
      value: stripeSecret.parameterName,
    });

    new cdk.CfnOutput(this, "GoogleOAuthClientIdParameterName", {
      value: googleOAuthClientId.parameterName,
    });

    new cdk.CfnOutput(this, "DeployRoleArn", {
      value: this.deployRole.roleArn,
    });
  }
}
