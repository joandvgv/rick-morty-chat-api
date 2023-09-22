import { EventBridgeEvent } from "aws-lambda";
import * as AWS from "aws-sdk";
import { PutEventMutationVariables } from "../types/chat";

const eventBridge = new AWS.EventBridge({
  region: process.env.AWS_REGION,
});

export default async function eventProcessor(
  event: EventBridgeEvent<"EventResponse", PutEventMutationVariables>,
) {
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
