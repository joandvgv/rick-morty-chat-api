import { DynamoDB } from "aws-sdk";
import chunk from "lodash/chunk";
import { DeleteMessagesMutationVariables } from "../../types/chat";
import getMessages from "./getMessages";

const dynamoDbClient = new DynamoDB.DocumentClient({
  apiVersion: "latest",
  region: process.env.AWS_REGION,
});

export default async function deleteMessages(
  _: any,
  data: DeleteMessagesMutationVariables,
) {
  const messages = (await getMessages(null, data)) ?? [];

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
    dynamoDbClient
      .batchWrite({
        RequestItems: {
          [process.env.MESSAGES_TABLE_NAME!]: requestItems,
        },
      })
      .promise(),
  );

  await Promise.all(promises);

  return { ids: messages.map((item) => item.id) };
}
