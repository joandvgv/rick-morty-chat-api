import { RemovalPolicy } from "aws-cdk-lib";
import {
  AttributeType,
  BillingMode,
  ProjectionType,
  Table,
} from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

const TABLE_NAME = "ChatConnections";
export const GSI_NAME = "ConnectionIdMap";

export const createConnectionsTable = (context: Construct) => {
  const table = new Table(context, TABLE_NAME, {
    billingMode: BillingMode.PROVISIONED,
    readCapacity: 1,
    writeCapacity: 1,
    removalPolicy: RemovalPolicy.DESTROY,
    tableName: TABLE_NAME,
    partitionKey: {
      name: "threadId",
      type: AttributeType.STRING,
    },
    sortKey: {
      name: "connectionId",
      type: AttributeType.STRING,
    },
  });
  table.addGlobalSecondaryIndex({
    partitionKey: {
      name: "connectionId",
      type: AttributeType.STRING,
    },
    sortKey: {
      name: "threadId",
      type: AttributeType.STRING,
    },
    indexName: GSI_NAME,
    projectionType: ProjectionType.KEYS_ONLY,
  });
  return table;
};
