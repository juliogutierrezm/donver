import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import type { Construct } from "constructs";

export interface DonverAuthStackProps extends cdk.StackProps {
  envName: "dev" | "prod";
}

export class DonverAuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: DonverAuthStackProps) {
    super(scope, id, props);

    this.userPool = new cognito.UserPool(this, "DonverUserPool", {
      userPoolName: `donver-user-pool-${props.envName}`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        fullname: {
          required: true,
          mutable: true,
        },
      },
    });

    const googleClientId = this.node.tryGetContext("googleOAuthClientId") as string | undefined;
    const googleClientSecret = this.node.tryGetContext("googleOAuthClientSecret") as
      | string
      | undefined;

    if (googleClientId && googleClientSecret) {
      const googleProvider = new cognito.UserPoolIdentityProviderGoogle(
        this,
        "DonverGoogleProvider",
        {
          userPool: this.userPool,
          clientId: googleClientId,
          clientSecretValue: cdk.SecretValue.unsafePlainText(googleClientSecret),
          scopes: ["email", "profile", "openid"],
          attributeMapping: {
            email: cognito.ProviderAttribute.GOOGLE_EMAIL,
            fullname: cognito.ProviderAttribute.GOOGLE_NAME,
            profilePicture: cognito.ProviderAttribute.GOOGLE_PICTURE,
          },
        }
      );

      googleProvider.node.addDependency(this.userPool);
    }

    this.userPoolClient = this.userPool.addClient("DonverWebClient", {
      userPoolClientName: `donver-web-client-${props.envName}`,
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: true,
      },
      preventUserExistenceErrors: true,
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: false,
        },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
        callbackUrls: [
          "http://localhost:5173/auth/callback",
          "https://app.donver.cr/auth/callback",
        ],
        logoutUrls: [
          "http://localhost:5173/",
          "https://app.donver.cr/",
        ],
      },
      supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO],
    });

    new cdk.CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
    });
  }
}
