import * as cdk from "aws-cdk-lib";
import { RemovalPolicy } from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import type { Construct } from "constructs";

export interface DonverDataStackProps extends cdk.StackProps {
  envName: "dev" | "prod";
}

export class DonverDataStack extends cdk.Stack {
  public readonly mainTable: dynamodb.Table;
  public readonly coreTable: dynamodb.Table;
  public readonly bookingsTable: dynamodb.Table;
  public readonly messagingTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DonverDataStackProps) {
    super(scope, id, props);

    const createDomainTable = (id: string, tableName: string) => {
      const table = new dynamodb.Table(this, id, {
        tableName,
        partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
        sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        timeToLiveAttribute: "ttl",
        pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: props.envName === "prod" },
        removalPolicy: props.envName === "prod" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      });

      table.addGlobalSecondaryIndex({
        indexName: "GSI1",
        partitionKey: { name: "gsi1pk", type: dynamodb.AttributeType.STRING },
        sortKey: { name: "gsi1sk", type: dynamodb.AttributeType.STRING },
        projectionType: dynamodb.ProjectionType.ALL,
      });

      table.addGlobalSecondaryIndex({
        indexName: "GSI2",
        partitionKey: { name: "gsi2pk", type: dynamodb.AttributeType.STRING },
        sortKey: { name: "gsi2sk", type: dynamodb.AttributeType.STRING },
        projectionType: dynamodb.ProjectionType.ALL,
      });

      return table;
    };

    this.mainTable = new dynamodb.Table(this, "DonverMainTable", {
      tableName: `donver-main-${props.envName}`,
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "ttl",
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: props.envName === "prod" },
      removalPolicy: props.envName === "prod" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    this.mainTable.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "gsi1pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "gsi1sk", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.mainTable.addGlobalSecondaryIndex({
      indexName: "GSI2",
      partitionKey: { name: "gsi2pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "gsi2sk", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.coreTable = createDomainTable("DonverCoreTable", `donver-core-${props.envName}`);
    this.bookingsTable = createDomainTable("DonverBookingsTable", `donver-bookings-${props.envName}`);
    this.messagingTable = createDomainTable("DonverMessagingTable", `donver-messaging-${props.envName}`);

    new cdk.CfnOutput(this, "MainTableName", {
      value: this.mainTable.tableName,
    });

    new cdk.CfnOutput(this, "MainTableArn", {
      value: this.mainTable.tableArn,
    });

    new cdk.CfnOutput(this, "CoreTableName", {
      value: this.coreTable.tableName,
    });

    new cdk.CfnOutput(this, "CoreTableArn", {
      value: this.coreTable.tableArn,
    });

    new cdk.CfnOutput(this, "BookingsTableName", {
      value: this.bookingsTable.tableName,
    });

    new cdk.CfnOutput(this, "BookingsTableArn", {
      value: this.bookingsTable.tableArn,
    });

    new cdk.CfnOutput(this, "MessagingTableName", {
      value: this.messagingTable.tableName,
    });

    new cdk.CfnOutput(this, "MessagingTableArn", {
      value: this.messagingTable.tableArn,
    });
  }
}
