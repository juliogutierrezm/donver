import * as cdk from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import { HttpUserPoolAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import {
  HttpLambdaIntegration,
  WebSocketLambdaIntegration,
} from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as iam from "aws-cdk-lib/aws-iam";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import type * as s3 from "aws-cdk-lib/aws-s3";
import { fileURLToPath } from "url";
import path from "path";
import type { Construct } from "constructs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DonverApiStackProps extends cdk.StackProps {
  envName: "dev" | "prod";
  userPool: cognito.IUserPool;
  userPoolClient: cognito.IUserPoolClient;
  spacePhotosBucket: s3.IBucket;
  petPhotosBucket: s3.IBucket;
}

export class DonverApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DonverApiStackProps) {
    super(scope, id, props);

    const coreTableName = `donver-core-${props.envName}`;
    const bookingsTableName = `donver-bookings-${props.envName}`;
    const messagingTableName = `donver-messaging-${props.envName}`;

    const commonEnv: Record<string, string> = {
      DONVER_ENV: props.envName,
      CORE_TABLE_NAME: coreTableName,
      BOOKINGS_TABLE_NAME: bookingsTableName,
      MESSAGING_TABLE_NAME: messagingTableName,
      SPACE_PHOTOS_BUCKET: props.spacePhotosBucket.bucketName,
      PET_PHOTOS_BUCKET: props.petPhotosBucket.bucketName,
      COGNITO_USER_POOL_CLIENT_ID: props.userPoolClient.userPoolClientId,
    };

    const createFn = (constructId: string, handlerName: string): NodejsFunction => {
      const logGroup = new logs.LogGroup(this, `${constructId}Logs`, {
        logGroupName: `/aws/lambda/donver-${handlerName}-${props.envName}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
      return new NodejsFunction(this, constructId, {
        functionName: `donver-${handlerName}-${props.envName}`,
        entry: path.join(__dirname, `../lambda/handlers/${handlerName}/index.ts`),
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "handler",
        memorySize: 256,
        timeout: cdk.Duration.seconds(15),
        environment: commonEnv,
        logGroup,
        bundling: {
          externalModules: ["@aws-sdk/*"],
          minify: false,
          target: "node20",
        },
      });
    };

    const grantDomainTableAccess = (
      fn: lambda.IFunction,
      tableName: string,
      actions: string[] = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem",
        "dynamodb:ConditionCheckItem",
      ],
    ) => {
      const tableArn = this.formatArn({
        service: "dynamodb",
        resource: "table",
        resourceName: tableName,
      });

      fn.addToRolePolicy(
        new iam.PolicyStatement({
          actions,
          resources: [tableArn, `${tableArn}/index/*`],
        }),
      );
    };

    const authRegisterFn      = createFn("AuthRegisterFn",       "auth-register");
    const authBootstrapFn     = createFn("AuthBootstrapFn",     "auth-bootstrap");
    const getMeFn             = createFn("GetMeFn",              "get-me");
    const updateProfileFn     = createFn("UpdateProfileFn",      "update-profile");
    const listSpacesFn        = createFn("ListSpacesFn",         "list-spaces");
    const getSpaceDetailFn    = createFn("GetSpaceDetailFn",     "get-space-detail");
    const listMySpacesFn      = createFn("ListMySpacesFn",       "list-my-spaces");
    const createSpaceFn       = createFn("CreateSpaceFn",        "create-space");
    const updateSpaceFn       = createFn("UpdateSpaceFn",        "update-space");
    const listPetsFn          = createFn("ListPetsFn",           "list-pets");
    const createPetFn         = createFn("CreatePetFn",          "create-pet");
    const updatePetFn         = createFn("UpdatePetFn",          "update-pet");
    const deletePetFn         = createFn("DeletePetFn",          "delete-pet");
    const listOwnerBookingsFn = createFn("ListOwnerBookingsFn",  "list-owner-bookings");
    const listCgBookingsFn    = createFn("ListCgBookingsFn",     "list-caregiver-bookings");
    const getBookingDetailFn  = createFn("GetBookingDetailFn",   "get-booking-detail");
    const createBookingFn     = createFn("CreateBookingFn",      "create-booking");
    const confirmBookingFn    = createFn("ConfirmBookingFn",     "confirm-booking");
    const cancelBookingFn     = createFn("CancelBookingFn",      "cancel-booking");
    const createBlockedDateFn = createFn("CreateBlockedDateFn",  "create-blocked-date");
    const deleteBlockedDateFn = createFn("DeleteBlockedDateFn",  "delete-blocked-date");
    const caregiverOnboardingFn = createFn("CaregiverOnboardingFn", "caregiver-onboarding");
    const listReviewsFn       = createFn("ListReviewsFn",        "list-reviews");
    const createReviewFn      = createFn("CreateReviewFn",       "create-review");
    const createUploadUrlFn   = createFn("CreateUploadUrlFn",    "create-upload-url");
    const listConvsFn         = createFn("ListConvsFn",          "list-conversations");
    const listMessagesFn      = createFn("ListMessagesFn",       "list-messages");
    const wsConnectFn         = createFn("WsConnectFn",          "ws-connect");
    const wsDisconnectFn      = createFn("WsDisconnectFn",       "ws-disconnect");
    const wsSendMessageFn     = createFn("WsSendMessageFn",      "ws-send-message");

    const coreFunctions = [
      authRegisterFn, authBootstrapFn, getMeFn, updateProfileFn, caregiverOnboardingFn, listSpacesFn, getSpaceDetailFn,
      listMySpacesFn, listCgBookingsFn, createSpaceFn, updateSpaceFn, listPetsFn, createPetFn,
      updatePetFn, deletePetFn, listReviewsFn, createReviewFn, createBookingFn,
    ];
    coreFunctions.forEach((fn) => grantDomainTableAccess(fn, coreTableName));

    const bookingsFunctions = [
      getSpaceDetailFn, listOwnerBookingsFn, listCgBookingsFn, createBookingFn,
      confirmBookingFn, cancelBookingFn, createBlockedDateFn, deleteBlockedDateFn, createReviewFn,
    ];
    bookingsFunctions.forEach((fn) => grantDomainTableAccess(fn, bookingsTableName));

    grantDomainTableAccess(getBookingDetailFn, bookingsTableName, ["dynamodb:GetItem"]);
    grantDomainTableAccess(getBookingDetailFn, coreTableName, ["dynamodb:GetItem"]);

    // Availability blocked-dates handlers call userHasRole() and read the space record from Core.
    // Keep least-privilege: read-only access (GetItem) to the Core table.
    grantDomainTableAccess(createBlockedDateFn, coreTableName, ["dynamodb:GetItem"]);
    grantDomainTableAccess(deleteBlockedDateFn, coreTableName, ["dynamodb:GetItem"]);

    const messagingFunctions = [
      listConvsFn, listMessagesFn, wsConnectFn, wsDisconnectFn, wsSendMessageFn,
    ];
    messagingFunctions.forEach((fn) => grantDomainTableAccess(fn, messagingTableName));

    props.spacePhotosBucket.grantPut(createUploadUrlFn);
    props.petPhotosBucket.grantPut(createUploadUrlFn);

    const jwtAuthorizer = new HttpUserPoolAuthorizer("DonverJwtAuthorizer", props.userPool, {
      userPoolClients: [props.userPoolClient],
      userPoolRegion: this.region,
    });

    const httpApi = new apigwv2.HttpApi(this, "DonverHttpApi", {
      apiName: `donver-http-api-${props.envName}`,
      corsPreflight: {
        allowHeaders: ["authorization", "content-type", "x-requested-with"],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PUT,
          apigwv2.CorsHttpMethod.PATCH,
          apigwv2.CorsHttpMethod.DELETE,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: [
          "http://localhost:5173",
          "http://localhost:4173",
          "http://127.0.0.1:5173",
          "http://127.0.0.1:4173",
          "https://app.donver.cr",
        ],
        allowCredentials: true,
      },
    });

    const h = (fn: lambda.IFunction, intId: string) => new HttpLambdaIntegration(intId, fn);
    const auth = jwtAuthorizer;

    httpApi.addRoutes({ path: "/auth/register",   methods: [apigwv2.HttpMethod.POST], integration: h(authRegisterFn, "AuthRegister") });
    httpApi.addRoutes({ path: "/auth/bootstrap",  methods: [apigwv2.HttpMethod.POST], integration: h(authBootstrapFn, "AuthBootstrap"),    authorizer: auth });
    httpApi.addRoutes({ path: "/me",               methods: [apigwv2.HttpMethod.GET],  integration: h(getMeFn, "GetMe"),                    authorizer: auth });
    httpApi.addRoutes({ path: "/me/profile",        methods: [apigwv2.HttpMethod.PUT],  integration: h(updateProfileFn, "UpdateProfile"),    authorizer: auth });
    httpApi.addRoutes({ path: "/caregiver/onboarding", methods: [apigwv2.HttpMethod.POST], integration: h(caregiverOnboardingFn, "CaregiverOnboarding"), authorizer: auth });
    httpApi.addRoutes({ path: "/spaces",           methods: [apigwv2.HttpMethod.GET],  integration: h(listSpacesFn, "ListSpaces") });
    httpApi.addRoutes({ path: "/spaces/{id}",      methods: [apigwv2.HttpMethod.GET],  integration: h(getSpaceDetailFn, "GetSpaceDetail") });
    httpApi.addRoutes({ path: "/spaces/{id}/reviews", methods: [apigwv2.HttpMethod.GET],  integration: h(listReviewsFn, "ListReviews") });
    httpApi.addRoutes({ path: "/spaces/{id}/reviews", methods: [apigwv2.HttpMethod.POST], integration: h(createReviewFn, "CreateReview"),    authorizer: auth });
    httpApi.addRoutes({ path: "/caregiver/spaces",                                    methods: [apigwv2.HttpMethod.GET],    integration: h(listMySpacesFn, "ListMySpaces"),          authorizer: auth });
    httpApi.addRoutes({ path: "/caregiver/spaces",                                    methods: [apigwv2.HttpMethod.POST],   integration: h(createSpaceFn, "CreateSpace"),            authorizer: auth });
    httpApi.addRoutes({ path: "/caregiver/spaces/{id}",                               methods: [apigwv2.HttpMethod.PUT],    integration: h(updateSpaceFn, "UpdateSpace"),            authorizer: auth });
    httpApi.addRoutes({ path: "/caregiver/spaces/{id}/blocked-dates",                 methods: [apigwv2.HttpMethod.POST],   integration: h(createBlockedDateFn, "CreateBlockedDate"), authorizer: auth });
    httpApi.addRoutes({ path: "/caregiver/spaces/{id}/blocked-dates/{blockedDateId}", methods: [apigwv2.HttpMethod.DELETE], integration: h(deleteBlockedDateFn, "DeleteBlockedDate"), authorizer: auth });
    httpApi.addRoutes({ path: "/caregiver/bookings",                                  methods: [apigwv2.HttpMethod.GET],    integration: h(listCgBookingsFn, "ListCgBookings"),      authorizer: auth });
    httpApi.addRoutes({ path: "/owner/pets",       methods: [apigwv2.HttpMethod.GET],    integration: h(listPetsFn, "ListPets"),       authorizer: auth });
    httpApi.addRoutes({ path: "/owner/pets",       methods: [apigwv2.HttpMethod.POST],   integration: h(createPetFn, "CreatePet"),     authorizer: auth });
    httpApi.addRoutes({ path: "/owner/pets/{id}",  methods: [apigwv2.HttpMethod.PUT],    integration: h(updatePetFn, "UpdatePet"),     authorizer: auth });
    httpApi.addRoutes({ path: "/owner/pets/{id}",  methods: [apigwv2.HttpMethod.DELETE], integration: h(deletePetFn, "DeletePet"),     authorizer: auth });
    httpApi.addRoutes({ path: "/owner/bookings",   methods: [apigwv2.HttpMethod.GET],    integration: h(listOwnerBookingsFn, "ListOwnerBookings"), authorizer: auth });
    httpApi.addRoutes({ path: "/bookings/{id}",    methods: [apigwv2.HttpMethod.GET],    integration: h(getBookingDetailFn, "GetBookingDetail"), authorizer: auth });
    httpApi.addRoutes({ path: "/bookings",           methods: [apigwv2.HttpMethod.POST], integration: h(createBookingFn, "CreateBooking"), authorizer: auth });
    httpApi.addRoutes({ path: "/bookings/{id}/confirm", methods: [apigwv2.HttpMethod.POST], integration: h(confirmBookingFn, "ConfirmBooking"), authorizer: auth });
    httpApi.addRoutes({ path: "/bookings/{id}/cancel", methods: [apigwv2.HttpMethod.POST], integration: h(cancelBookingFn, "CancelBooking"), authorizer: auth });
    httpApi.addRoutes({ path: "/uploads/presign",                      methods: [apigwv2.HttpMethod.POST], integration: h(createUploadUrlFn, "CreateUploadUrl"), authorizer: auth });
    httpApi.addRoutes({ path: "/messages/conversations",               methods: [apigwv2.HttpMethod.GET],  integration: h(listConvsFn, "ListConvs"),             authorizer: auth });
    httpApi.addRoutes({ path: "/messages/conversations/{id}/messages", methods: [apigwv2.HttpMethod.GET],  integration: h(listMessagesFn, "ListMessages"),        authorizer: auth });

    const wsApi = new apigwv2.WebSocketApi(this, "DonverWebSocketApi", {
      apiName: `donver-websocket-api-${props.envName}`,
      connectRouteOptions: {
        integration: new WebSocketLambdaIntegration("WsConnectInt", wsConnectFn),
      },
      disconnectRouteOptions: {
        integration: new WebSocketLambdaIntegration("WsDisconnectInt", wsDisconnectFn),
      },
      routeSelectionExpression: "$request.body.action",
    });

    wsApi.addRoute("sendMessage", {
      integration: new WebSocketLambdaIntegration("WsSendMessageInt", wsSendMessageFn),
    });

    const wsStage = new apigwv2.WebSocketStage(this, "WsStage", {
      webSocketApi: wsApi,
      stageName: props.envName,
      autoDeploy: true,
    });

    wsSendMessageFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ["execute-api:ManageConnections"],
      resources: [
        `arn:aws:execute-api:${this.region}:${this.account}:${wsApi.apiId}/${props.envName}/POST/@connections/*`,
      ],
    }));

    new cdk.CfnOutput(this, "ApiBaseUrl",   { value: httpApi.url ?? "" });
    new cdk.CfnOutput(this, "WebSocketUrl", { value: wsStage.url });
  }
}
