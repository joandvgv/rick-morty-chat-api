import { DynamoDB } from "aws-sdk";
import { FieldNode, Kind, StringValueNode, parse } from "graphql";
import { ApolloServer } from "@apollo/server";
import {
  startServerAndCreateLambdaHandler,
  handlers,
  middleware,
} from "@as-integrations/aws-lambda";

import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from "aws-lambda";
import { RequestHandler } from "@as-integrations/aws-lambda/dist/request-handlers/_index";
import typeDefs from "../graphql/schema";

import {
  generateApolloCompatibleEvent,
  generateApolloCompatibleEventFromWebsocketEvent,
  generateLambdaProxyResponse,
  oneHourFromNow,
} from "../utils";
import putMessage from "../graphql/resolvers/putMessage";
import getMessages from "../graphql/resolvers/getMessages";

const dynamoDbClient = new DynamoDB.DocumentClient({
  apiVersion: "latest",
  region: process.env.AWS_REGION,
});

const resolvers = {
  Mutation: {
    putMessage,
  },
  Query: {
    getMessages,
  },
};
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const corsMiddleware: middleware.MiddlewareFn<
  RequestHandler<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2>
> = async () => (result) => {
  // eslint-disable-next-line no-param-reassign
  result.headers = {
    ...result.headers,
    "Access-Control-Allow-Origin": "*",
    Vary: "Origin",
  };
  return Promise.resolve();
};

const handler = startServerAndCreateLambdaHandler(
  server,
  handlers.createAPIGatewayProxyEventV2RequestHandler(),
  {
    middleware: [corsMiddleware],
  },
);

export default async function handleMessage(event: any) {
  const operation = JSON.parse(event.body.replace(/\n/g, ""));
  const graphqlDocument = parse(operation.query);
  const isWsConnection: boolean = !event.resource;

  const [definition] = graphqlDocument.definitions;
  const operationDefinition = definition.kind === Kind.OPERATION_DEFINITION;

  if (operationDefinition && definition.operation === "subscription") {
    if (!isWsConnection) {
      return generateLambdaProxyResponse(
        400,
        "REST Subscription not supported",
      );
    }
    const { connectionId } = event.requestContext;

    const selection = definition.selectionSet.selections[0] as FieldNode;

    if (!selection.arguments) {
      return generateLambdaProxyResponse(400, "Invalid payload");
    }

    const [argument] = selection.arguments;
    const value = argument.value as StringValueNode;
    const threadId = value.value;

    await dynamoDbClient
      .put({
        TableName: process.env.TABLE_NAME!,
        Item: {
          threadId,
          connectionId,
          ttl: oneHourFromNow(),
        },
      })
      .promise();
    return generateLambdaProxyResponse(200, "Ok");
  }

  if (isWsConnection) {
    return handler(
      generateApolloCompatibleEventFromWebsocketEvent(event),
      {} as Context,
      () => {},
    );
  }

  return handler(generateApolloCompatibleEvent(event), {} as Context, () => {});
}
