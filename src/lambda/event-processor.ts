import { EventBridgeEvent } from "aws-lambda";
import { DynamoDB, EventBridge } from "aws-sdk";
import { PutMessageMutationVariables } from "../types/chat";

const eventBridge = new EventBridge({
  region: process.env.AWS_REGION,
});

const dynamoDbClient = new DynamoDB.DocumentClient({
  apiVersion: "latest",
  region: process.env.AWS_REGION,
});

export default async function eventProcessor(
  event: EventBridgeEvent<"EventResponse", PutMessageMutationVariables>,
) {
  await dynamoDbClient
    .put({
      TableName: process.env.TABLE_NAME!,
      Item: { ...event.detail, time: event.time },
    })
    .promise();

  return eventBridge
    .putEvents({
      Entries: [
        {
          Source: "event.processor",
          EventBusName: process.env.BUS_NAME,
          DetailType: process.env.RESPONSE_EVENT_DETAIL_TYPE,
          Time: new Date(),
          Detail: JSON.stringify({
            message: event.detail.message,
            threadId: event.detail.threadId,
          }),
        },
      ],
    })
    .promise();
}
