import { EventBridgeEvent } from "aws-lambda";
import { DynamoDB, EventBridge } from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
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
  const eventTime = event.time;
  const date = new Date(eventTime);
  const unixTimestamp = Math.floor(date.getTime() / 1000);

  const messageData = { ...event.detail, time: unixTimestamp, id: uuidv4() };

  await dynamoDbClient
    .put({
      TableName: process.env.TABLE_NAME!,
      Item: messageData,
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
          Detail: JSON.stringify(messageData),
        },
      ],
    })
    .promise();
}
