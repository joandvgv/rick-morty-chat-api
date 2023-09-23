import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { RestApi, LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { EventBus, Rule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { HttpMethod } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import {
  ShellStep,
  CodePipelineSource,
  CodePipeline,
} from "aws-cdk-lib/pipelines";
import LambdaFn from "./lambda";
import { createMessagesTable } from "./tables/messages";

export default class ApolloLambdaWebsocketStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const REQUEST_EVENT_DETAIL_TYPE = "ClientMessageReceived";
    const RESPONSE_EVENT_DETAIL_TYPE = "ClientMessageProcessed";

    const eventBus = new EventBus(this, "ApolloMutationEvents", {
      eventBusName: "ApolloMutationEvents",
    });

    const messagesTable = createMessagesTable(this);
    const requestHandlerLambda = new LambdaFn(this, "RequestHandler", {
      entryFilename: "graphql-query-handler.ts",
      handler: "default",
      name: "RequestHandler",
      description:
        "Handles GraphQL queries via WebSocket API and publishes to EventBridge to propagate messages to subscribes",
      envVariables: {
        BUS_NAME: eventBus.eventBusName,
        MESSAGES_TABLE_NAME: messagesTable.tableName,
        REQUEST_EVENT_DETAIL_TYPE,
      },
    });
    messagesTable.grantFullAccess(requestHandlerLambda.fn);
    eventBus.grantPutEventsTo(requestHandlerLambda.fn);

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
        },
      },
    );

    const eventProcessorLambda = new LambdaFn(this, "EventProcessorLambda", {
      entryFilename: "event-processor.ts",
      handler: "default",
      name: "EventProcessor",
      description:
        "Event processor that stores data and publishes to EventBridge to propagate messages to subscribers",
      envVariables: {
        BUS_NAME: eventBus.eventBusName,
        TABLE_NAME: messagesTable.tableName,
        RESPONSE_EVENT_DETAIL_TYPE,
      },
    });

    messagesTable.grantFullAccess(eventProcessorLambda.fn);

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

    eventBus.grantPutEventsTo(eventProcessorLambda.fn);

    eventBus.grantPutEventsTo(requestHandlerLambda.fn);

    const restApi = new RestApi(this, "ApolloRestApi", {
      description:
        "A Rest API that handles GraphQl queries via POST to /graphql.",
      deployOptions: {
        stageName: "dev",
        tracingEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowHeaders: ["*"],
        allowMethods: ["OPTIONS", "POST"],
        allowCredentials: true,
        allowOrigins: ["*"],
      },
      restApiName: "RestApi",
    });

    restApi.root
      .addResource("graphql")
      .addMethod(
        HttpMethod.POST,
        new LambdaIntegration(requestHandlerLambda.fn),
      );

    new CfnOutput(this, "RestApiEndpoint", {
      value: restApi.urlForPath("/graphql"),
      exportName: "RestApiEndpoint",
    });

    new CodePipeline(this, "Pipeline", {
      pipelineName: "DeploymentPipeline",
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.connection(
          "joandvgv/rick-morty-chat-api",
          "master",
          {
            connectionArn:
              "arn:aws:codestar-connections:us-west-2:268857687287:connection/5c0d085f-29da-4394-9f07-0174598f1fcd",
          },
        ),
        commands: ["npm ci", "npm run build", "npx cdk synth"],
      }),
    });
  }
}
