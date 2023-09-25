import { Duration } from "aws-cdk-lib";
import { Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import path = require("path");

export type Props = {
  memorySize?: number;
  reservedConcurrentExecutions?: number;
  runtime?: Runtime;
  name: string;
  description: string;
  entryFilename: string;
  handler?: string;
  timeout?: Duration;
  envVariables?: Record<string, string>;
};

export default class LambdaFn extends Construct {
  public fn: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.fn = new NodejsFunction(this, id, {
      entry: `${__dirname}/../src/lambda/${props.entryFilename}`,
      handler: props.handler ?? "handler",
      runtime: props.runtime ?? Runtime.NODEJS_18_X,
      timeout: props.timeout ?? Duration.seconds(5),
      memorySize: props.memorySize ?? 1024,
      tracing: Tracing.ACTIVE,
      functionName: props.name,
      description: props.description,
      depsLockFilePath: path.join(__dirname, "..", "yarn.lock"),
      environment: props.envVariables ?? {},
    });
  }
}
