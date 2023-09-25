import { EventBridgeEvent } from "aws-lambda";
import chunk from "lodash/chunk";
import {
  DeleteMessagesMutationVariables,
  PutMessageMutationVariables,
import Database from "../lib/aws/dynamo";
import EventHandler from "../lib/aws/event-bridge";

export const deleteMessages = async (
  event: EventBridgeEvent<"EventResponse", DeleteMessagesMutationVariables>,
) => {
  const messages = (await getMessages(null, event.detail)) ?? [];
  const database = new Database(process.env.MESSAGES_TABLE_NAME!);

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
    database.bulkDelete(requestItems),
  );

  await Promise.all(promises);
};

export const saveMessage = async (
  event: EventBridgeEvent<"EventResponse", PutMessageMutationVariables>,
) => {
  const database = new Database(process.env.MESSAGES_TABLE_NAME!);
  return database.save({ ...event.detail, id: event.id });
};

export default async function eventProcessor(
  event: EventBridgeEvent<"EventResponse", PutMessageMutationVariables>,
) {
  const eventHandler = new EventHandler(process.env.BUS_NAME!);

  const eventActionMap = {
    [process.env.REQUEST_EVENT_DETAIL_TYPE!]: {
      fn: saveMessage,
      name: "message",
    },
    [process.env.DELETE_EVENT_DETAIL_TYPE!]: {
      fn: deleteMessages,
      name: "bulkDelete",
    },
  } as const;

  const detailType = event["detail-type"];
  const action = eventActionMap[detailType];
  await action.fn(event);

  return eventHandler.emit(
    "event.processor",
    process.env.RESPONSE_EVENT_DETAIL_TYPE!,
    { ...event.detail, type: action.name },
  );
}
