import { ApolloServer } from "@apollo/server";
import {
  startServerAndCreateLambdaHandler,
  handlers,
  middleware,
} from "@as-integrations/aws-lambda";

import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from "aws-lambda";
import { RequestHandler } from "@as-integrations/aws-lambda/dist/request-handlers/_index";
import typeDefs from "../graphql/schema";

import { generateApolloCompatibleEvent } from "../utils";
import putMessage from "../graphql/resolvers/putMessage";
import getMessages from "../graphql/resolvers/getMessages";
import deleteMessages from "../graphql/resolvers/deleteMessages";

const resolvers = {
  Mutation: {
    putMessage,
    deleteMessages,
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
  // we need to mutate the object directly to force set cors headers
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

export default async function handleMessage(event: APIGatewayProxyEvent) {
  return handler(generateApolloCompatibleEvent(event), {} as Context, () => {});
}
