import Database from "../../lib/aws/dynamo";
import { GetMessagesQueryVariables } from "../../types/chat";

export default async function getMessages(
  _: unknown,
  data: GetMessagesQueryVariables,
) {
  const database = new Database(process.env.MESSAGES_TABLE_NAME!);
  return database.queryByKey("threadId", data.threadId);
}
