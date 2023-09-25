import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import "dotenv/config";

export default async function getCreds() {
  if (process.env.NODE_ENV === "development") {
    return process.env;
  }

  const client = new SSMClient({ region: "us-east-1" });
  const command = new GetParameterCommand({
    Name: "/chat-app",
    WithDecryption: true,
  });
  const res = await client.send(command);
  return JSON.parse(res.Parameter?.Value ?? "{}");
}
