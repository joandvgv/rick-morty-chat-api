import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import ApolloLambdaWebsocketStack from "./lib/stack";
const app = new cdk.App();

const stack = new ApolloLambdaWebsocketStack(app, "ApolloLambdaWebsocketStack");
cdk.Tags.of(stack).add("project", "rick-and-morty-chat-api");
cdk.Tags.of(stack).add("topic", "lambda-apollo-websockets-events");
app.synth();
