import * as AWS from "aws-sdk";
import { EventBridgeEvent } from "aws-lambda";

const dynamoDbClient = new AWS.DynamoDB.DocumentClient({
  apiVersion: "latest",
  region: process.env.AWS_REGION,
});

const gatewayClient = new AWS.ApiGatewayManagementApi({
  apiVersion: "latest",
  endpoint: process.env.API_GATEWAY_ENDPOINT,
});

interface ResponseEventDetails {
  message: string;
  threadId: string;
}

async function getConnectionsSubscribedToTopic(threadId: string) {
  const { Items: connectionId } = await dynamoDbClient
    .query({
      TableName: process.env.TABLE_NAME!,
      KeyConditionExpression: "threadId = :threadId",
      ExpressionAttributeValues: {
        ":threadId": threadId,
      },
    })
    .promise();

  return connectionId;
}

export default async function handler(
  event: EventBridgeEvent<"EventResponse", ResponseEventDetails>,
) {
  const connections = await getConnectionsSubscribedToTopic(
    event.detail.threadId,
  );
  const postToConnectionPromises = connections?.map(({ connectionId }) =>
    gatewayClient
      .postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify({ data: event.detail.message }),
      })
      .promise(),
  );
  await Promise.allSettled(postToConnectionPromises!);
  return true;
}
