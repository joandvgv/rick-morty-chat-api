import { EventBridge } from "aws-sdk";
import { DeleteMessagesMutationVariables } from "../../types/chat";

const eventBridge = new EventBridge({
  region: process.env.AWS_REGION,
});

export default async function deleteMessages(
  _: any,
  data: DeleteMessagesMutationVariables,
) {
  await eventBridge
    .putEvents({
      Entries: [
        {
          Source: "graphql.handler",
          EventBusName: process.env.BUS_NAME,
          DetailType: process.env.DELETE_EVENT_DETAIL_TYPE,
          Time: new Date(),
          Detail: JSON.stringify({
            threadId: data.threadId,
          }),
        },
      ],
    })
    .promise();

  return { success: true };
}
