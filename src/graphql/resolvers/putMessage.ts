import { PutMessageMutationVariables } from "../../types/chat";
import EventHandler from "../../lib/aws/event-bridge";

const REQUEST_EVENT_DETAIL_TYPE = process.env.REQUEST_EVENT_DETAIL_TYPE!;

export default async function putMessage(
  _: unknown,
  data: PutMessageMutationVariables,
) {
  const date = new Date();
  const unixTimestamp = Math.floor(date.getTime() / 1000);

  const eventDetail = {
    ...data,
    time: unixTimestamp,
  };

  const eventHandler = new EventHandler(process.env.BUS_NAME!);

  const result = await eventHandler.emit(
    "apollo",
    REQUEST_EVENT_DETAIL_TYPE,
    eventDetail,
  );

  if (result.error) throw new Error(result.error.message);

  return {
    ...data,
    id: result.id,
    time: unixTimestamp.toString(),
  };
}
