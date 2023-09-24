import { EventBridgeEvent } from "aws-lambda";
import Pusher from "pusher";
import credentials from "../environment";

interface ResponseEventDetails {
  message: string;
  threadId: string;
}

export default async function handler(
  event: EventBridgeEvent<"EventResponse", ResponseEventDetails>,
) {
  const environment = await credentials();
  const pusher = new Pusher({
    appId: environment.PUSHER_APP_ID!,
    key: environment.PUSHER_APP_KEY!,
    secret: environment.PUSHER_APP_SECRET!,
    cluster: environment.PUSHER_CLUSTER!,
    useTLS: true,
  });

  await pusher.trigger(event.detail.threadId, "message", event.detail);

  return true;
}
