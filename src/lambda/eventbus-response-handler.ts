import { EventBridgeEvent } from "aws-lambda";
import Pusher from "pusher";
import credentials from "environment";
import { PutMessageMutationVariables } from "types/chat";

type EventResponse = PutMessageMutationVariables & {
  type: "message" | "bulkDelete";
};

export default async function handler(
  event: EventBridgeEvent<"EventResponse", EventResponse>,
) {
  const environment = await credentials();
  const pusher = new Pusher({
    appId: environment.PUSHER_APP_ID!,
    key: environment.PUSHER_APP_KEY!,
    secret: environment.PUSHER_APP_SECRET!,
    cluster: environment.PUSHER_CLUSTER!,
    useTLS: true,
  });

  await pusher.trigger(event.detail.threadId, event.detail.type, event.detail);

  return true;
}
