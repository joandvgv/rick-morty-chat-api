import { EventBridge } from "aws-sdk";
import { PutMessageMutationVariables } from "../../types/chat";

const REQUEST_EVENT_DETAIL_TYPE = process.env.REQUEST_EVENT_DETAIL_TYPE!;

const eventBridge = new EventBridge({
  region: process.env.AWS_REGION,
});

export default async function putMessage(
  _: any,
  data: PutMessageMutationVariables,
) {
  const date = new Date();
  const unixTimestamp = Math.floor(date.getTime() / 1000);

  const eventDetail = {
    ...data,
    time: unixTimestamp,
  };

  const result = await eventBridge
    .putEvents({
      Entries: [
        {
          EventBusName: process.env.BUS_NAME,
          Source: "apollo",
          Time: date,
          DetailType: REQUEST_EVENT_DETAIL_TYPE,
          Detail: JSON.stringify(eventDetail),
        },
      ],
    })
    .promise();

  if (result.$response.error) throw new Error(result.$response.error.message);

  return {
    ...data,
    id: result.Entries![0].EventId,
    time: unixTimestamp.toString(),
  };
}
