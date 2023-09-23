import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import ApolloLambdaStack from "./lib/stack";

const app = new cdk.App();

const stack = new ApolloLambdaStack(app, "ApolloLambdaStack");
cdk.Tags.of(stack).add("project", "rick-and-morty-chat-api");
cdk.Tags.of(stack).add("topic", "lambda-apollo-websockets-events");
app.synth();
