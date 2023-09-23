import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";

export default class DeploymentPipeline extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
