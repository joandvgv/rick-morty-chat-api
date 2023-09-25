import { DeleteMessagesMutationVariables } from "../../types/chat";
import EventHandler from "../../lib/aws/event-bridge";

export default async function deleteMessages(
  _: unknown,
  data: DeleteMessagesMutationVariables,
) {
  const eventHandler = new EventHandler(process.env.BUS_NAME!);

  await eventHandler.emit(
    "graphql.handler",
    process.env.DELETE_EVENT_DETAIL_TYPE!,
    {
      threadId: data.threadId,
    },
  );

  return { success: true };
}
