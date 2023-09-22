import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { RestApi, LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { WebSocketLambdaIntegration as LambdaWebSocketIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { EventBus, Rule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { HttpMethod } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { WebSocketApi, WebSocketStage } from "@aws-cdk/aws-apigatewayv2-alpha";
import LambdaFn from "./lambda";
import { createConnectionsTable, GSI_NAME } from "./tables/connections";

export default class ApolloLambdaWebsocketStack extends Stack {
  private readonly webSocketApi: WebSocketApi;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const REQUEST_EVENT_DETAIL_TYPE = "ClientMessageReceived";
    const RESPONSE_EVENT_DETAIL_TYPE = "ClientMessageProcessed";

    const eventBus = new EventBus(this, "ApolloMutationEvents", {
      eventBusName: "ApolloMutationEvents",
    });

    const connectionsTable = createConnectionsTable(this);

    const connectionLambda = new LambdaFn(this, "ConnectionHandler", {
      entryFilename: "websocket-connection-handler.ts",
      handler: "default",
      name: "ConnectionHandler",
      description: "Handles connect & disconnected from WebSocket API",
      envVariables: {
        TABLE_NAME: connectionsTable.tableName,
        GSI_NAME,
      },
    });

    connectionsTable.grantFullAccess(connectionLambda.fn);

    this.webSocketApi = new WebSocketApi(this, "ApolloWebsocketApi", {
      apiName: "WebSocketApi",
      description: "A Websocket API that handles GraphQL queries",
      connectRouteOptions: {
        integration: new LambdaWebSocketIntegration(
          "Connection",
          connectionLambda.fn,
        ),
      },
      disconnectRouteOptions: {
        integration: new LambdaWebSocketIntegration(
          "Connection",
          connectionLambda.fn,
        ),
      },
    });

    const websocketStage = new WebSocketStage(this, "ApolloWebsocketStage", {
      webSocketApi: this.webSocketApi,
      stageName: "dev",
      autoDeploy: true,
    });

    const requestHandlerLambda = new LambdaFn(this, "RequestHandler", {
      entryFilename: "graphql-query-handler.ts",
      handler: "default",
      name: "RequestHandler",
      description:
        "Handles GraphQL queries via WebSocket API and publishes to EventBridge to propagate messages to subscribes",
      envVariables: {
        BUS_NAME: eventBus.eventBusName,
        TABLE_NAME: connectionsTable.tableName,
        REQUEST_EVENT_DETAIL_TYPE,
        API_GATEWAY_ENDPOINT: websocketStage.callbackUrl,
      },
    });

    connectionsTable.grantFullAccess(requestHandlerLambda.fn);
    eventBus.grantPutEventsTo(requestHandlerLambda.fn);

    requestHandlerLambda.fn.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [
          `arn:aws:execute-api:${this.region}:${this.account}:${this.webSocketApi.apiId}/${websocketStage.stageName}/*`,
        ],
        actions: ["execute-api:ManageConnections"],
      }),
    );

    this.webSocketApi.addRoute("$default", {
      integration: new LambdaWebSocketIntegration(
        "Request",
        requestHandlerLambda.fn,
      ),
    });

    const eventBridgeToSubscriptionsLambda = new LambdaFn(
      this,
      "ResponseHandler",
      {
        entryFilename: "eventbus-response-handler.ts",
        handler: "default",
        name: "ResponseHandler",
        description:
          "Handles GraphQL responses from EventBridge and sends it to subscribers",
        envVariables: {
          BUS_NAME: eventBus.eventBusName,
          TABLE_NAME: connectionsTable.tableName,
          API_GATEWAY_ENDPOINT: websocketStage.callbackUrl,
        },
      },
    );

    const eventProcessorLambda = new LambdaFn(this, "EventProcessorLambda", {
      entryFilename: "event-processor.ts",
      handler: "default",
      name: "EventProcessor",
      description:
        "Dummy event processor that publishes to EventBridge to propagate messages to subscribers",
      envVariables: {
        BUS_NAME: eventBus.eventBusName,
        RESPONSE_EVENT_DETAIL_TYPE,
      },
    });

    new Rule(this, "ProcessRequest", {
      eventBus,
      enabled: true,
      ruleName: "ProcessRequest",
      eventPattern: {
        detailType: [REQUEST_EVENT_DETAIL_TYPE],
      },
      targets: [new LambdaFunction(eventProcessorLambda.fn)],
    });

    new Rule(this, "NotifyApolloSubscribers", {
      eventBus,
      enabled: true,
      ruleName: "RespondToChat",
      eventPattern: {
        detailType: [RESPONSE_EVENT_DETAIL_TYPE],
      },
      targets: [new LambdaFunction(eventBridgeToSubscriptionsLambda.fn)],
    });

    connectionsTable.grantFullAccess(eventBridgeToSubscriptionsLambda.fn);
    eventBus.grantPutEventsTo(eventProcessorLambda.fn);

    eventBridgeToSubscriptionsLambda.fn.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [
          `arn:aws:execute-api:${this.region}:${this.account}:${this.webSocketApi.apiId}/${websocketStage.stageName}/*`,
        ],
        actions: ["execute-api:ManageConnections"],
      }),
    );

    eventBus.grantPutEventsTo(requestHandlerLambda.fn);

    const restApi = new RestApi(this, "ApolloRestApi", {
      description:
        "A Rest API that handles GraphQl queries via POST to /graphql.",
      deployOptions: {
        stageName: "dev",
        tracingEnabled: true,
      },
      restApiName: "RestApi",
    });

    restApi.root
      .addResource("graphql")
      .addMethod(
        HttpMethod.POST,
        new LambdaIntegration(requestHandlerLambda.fn),
      );

    new CfnOutput(this, "WebsocketApiEndpoint", {
      value: `${this.webSocketApi.apiEndpoint}/${websocketStage.stageName}`,
      exportName: "WebsocketApiEndpoint",
    });

    new CfnOutput(this, "RestApiEndpoint", {
      value: restApi.urlForPath("/graphql"),
      exportName: "RestApiEndpoint",
    });
  }
}
