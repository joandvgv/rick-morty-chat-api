import { DynamoDB } from "aws-sdk";
import { GetMessagesQueryVariables } from "../../types/chat";

const dynamoDbClient = new DynamoDB.DocumentClient({
  apiVersion: "latest",
  region: process.env.AWS_REGION,
});

export default async function getMessages(
  _: unknown,
  data: GetMessagesQueryVariables,
) {
  const result = await dynamoDbClient
    .query({
      TableName: process.env.MESSAGES_TABLE_NAME!,
      KeyConditionExpression: "threadId = :threadId",
      ExpressionAttributeValues: {
        ":threadId": data.threadId,
      },
    })
    .promise();
  return result.Items;
}
