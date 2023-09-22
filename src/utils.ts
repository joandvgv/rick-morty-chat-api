import { APIGatewayProxyEventV2 } from "aws-lambda";

/**
 * Generates an object that is compatible with Lambda Proxy integration
 */
export function generateLambdaProxyResponse(
  httpCode: number,
  jsonBody: string,
) {
  return {
    body: jsonBody,
    statusCode: httpCode,
  };
}

/**
 * Generates an object that is compatible with Apollo Server V4 Lambda Handler
 * as websockets payload is different than regular API Gateway requests
 */
export function generateApolloCompatibleEventFromWebsocketEvent(
  event: any,
): APIGatewayProxyEventV2 {
  const deepClonedEvent: APIGatewayProxyEventV2 = JSON.parse(
    JSON.stringify(event),
  );
  deepClonedEvent.requestContext = {
    ...deepClonedEvent.requestContext,
    http: {
      ...deepClonedEvent.requestContext.http,
      method: "POST",
    },
  };
  deepClonedEvent.headers = { "Content-Type": "application/json" };

  return deepClonedEvent;
}

/**
 * Generates an object that is compatible with Apollo Server V4 Lambda Handler
 * as api gateway payload differs slightly from the one that is expected by Apollo
 */
export function generateApolloCompatibleEvent(
  event: any,
): APIGatewayProxyEventV2 {
  const deepClonedEvent: APIGatewayProxyEventV2 = JSON.parse(
    JSON.stringify(event),
  );
  deepClonedEvent.requestContext = {
    ...deepClonedEvent.requestContext,
    http: {
      ...deepClonedEvent.requestContext.http,
      method: "POST",
    },
  };

  return deepClonedEvent;
}

export const oneHourFromNow = () => Math.round(Date.now() / 1000 + 3600);
