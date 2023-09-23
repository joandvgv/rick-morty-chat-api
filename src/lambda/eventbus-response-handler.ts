import { EventBridgeEvent } from "aws-lambda";
import Pusher from "pusher";

interface ResponseEventDetails {
  message: string;
  threadId: string;
}

export default async function handler(
  event: EventBridgeEvent<"EventResponse", ResponseEventDetails>,
) {
  const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_APP_KEY!,
    secret: process.env.PUSHER_APP_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true,
  });

  await pusher.trigger(event.detail.threadId, "message", event.detail);

  return true;
}
