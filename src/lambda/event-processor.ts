import { EventBridgeEvent } from "aws-lambda";
import { DynamoDB, EventBridge } from "aws-sdk";
import chunk from "lodash/chunk";
import {
  DeleteMessagesMutationVariables,
  PutMessageMutationVariables,
} from "../types/chat";
import getMessages from "../graphql/resolvers/getMessages";

const eventBridge = new EventBridge({
  region: process.env.AWS_REGION,
});

const dynamoDbClient = new DynamoDB.DocumentClient({
  apiVersion: "latest",
  region: process.env.AWS_REGION,
});

export const deleteMessages = async (
  event: EventBridgeEvent<"EventResponse", DeleteMessagesMutationVariables>,
) => {
  const messages = (await getMessages(null, event.detail)) ?? [];

  const deleteRequests = messages.map((item) => ({
    DeleteRequest: {
      Key: {
        threadId: item.threadId,
        time: item.time,
      },
    },
  }));

  const chunks = chunk(deleteRequests, 25);

  const promises = chunks.map((requestItems) =>
    dynamoDbClient
      .batchWrite({
        RequestItems: {
          [process.env.MESSAGES_TABLE_NAME!]: requestItems,
        },
      })
      .promise(),
  );

  await Promise.all(promises);
};

export const saveMessage = async (
  event: EventBridgeEvent<"EventResponse", PutMessageMutationVariables>,
) =>
  dynamoDbClient
    .put({
      TableName: process.env.TABLE_NAME!,
      Item: { ...event.detail, id: event.id },
    })
    .promise();

export default async function eventProcessor(
  event: EventBridgeEvent<"EventResponse", PutMessageMutationVariables>,
) {
  const eventActionMap = {
    [process.env.REQUEST_EVENT_DETAIL_TYPE!]: saveMessage,
    [process.env.DELETE_EVENT_DETAIL_TYPE!]: deleteMessages,
  } as const;

  await eventActionMap[event["detail-type"]](event);

  return eventBridge
    .putEvents({
      Entries: [
        {
          Source: "event.processor",
          EventBusName: process.env.BUS_NAME,
          DetailType: event["detail-type"],
          Time: new Date(),
          Detail: JSON.stringify(event.detail),
        },
      ],
    })
    .promise();
}
