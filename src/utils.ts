import { APIGatewayProxyEvent, APIGatewayProxyEventV2 } from "aws-lambda";

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
 * as api gateway payload differs slightly from the one that is expected by Apollo (apigateay v2 vs v1 we're using)
 */
export function generateApolloCompatibleEvent(event: APIGatewayProxyEvent) {
  return {
    ...event,
    requestContext: {
      ...event.requestContext,
      http: {
        method: "POST",
        path: event.requestContext.resourcePath,
        protocol: event.requestContext.protocol,
        sourceIp: event.requestContext.identity.sourceIp,
        userAgent: event.requestContext.identity.userAgent ?? "",
      },
    },
  } as unknown as APIGatewayProxyEventV2; // we're lying here, but it's ok as we're not using any of the missing v2 properties;
}

export const oneHourFromNow = () => Math.round(Date.now() / 1000 + 3600);
