import { APIGatewayEvent } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import * as AWS from "aws-sdk";
import { generateLambdaProxyResponse } from "../utils";

const dynamoDbClient: DocumentClient = new AWS.DynamoDB.DocumentClient({
  apiVersion: "latest",
  region: process.env.AWS_REGION,
});

export default async function connectionHandler(
  event: APIGatewayEvent,
): Promise<any> {
  const { eventType, connectionId } = event.requestContext;

  if (eventType === "CONNECT") {
    // Ignore, since we only care about subscriptions
    return generateLambdaProxyResponse(200, "Connected");
  }

  if (eventType === "DISCONNECT") {
    const { Items: connections } = await dynamoDbClient
      .query({
        TableName: process.env.TABLE_NAME!,
        IndexName: process.env.GSI_NAME!,
        KeyConditionExpression: "connectionId = :cId",
        ExpressionAttributeValues: {
          ":cId": connectionId,
        },
        ProjectionExpression: "threadId",
      })
      .promise();

    // Improve for batchWrite
    const deleteOperations = connections?.map((item) =>
      dynamoDbClient
        .delete({
          TableName: process.env.TABLE_NAME!,
          Key: {
            connectionId,
            threadId: item.threadId,
          },
        })
        .promise(),
    );

    await Promise.allSettled(deleteOperations ?? []);

    return generateLambdaProxyResponse(200, "Disconnected");
  }

  return generateLambdaProxyResponse(200, "Ok");
}
