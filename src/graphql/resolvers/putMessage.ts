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
  await eventBridge
    .putEvents({
      Entries: [
        {
          EventBusName: process.env.BUS_NAME,
          Source: "apollo",
          DetailType: REQUEST_EVENT_DETAIL_TYPE,
          Detail: JSON.stringify(data),
        },
      ],
    })
    .promise();
  return data;
}
