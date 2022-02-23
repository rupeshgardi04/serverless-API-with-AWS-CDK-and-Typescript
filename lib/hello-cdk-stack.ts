import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cdk from "aws-cdk-lib";
import { Table, AttributeType, } from "aws-cdk-lib/aws-dynamodb";

export class HelloCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'HelloCdkQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    new Table(this, "items", {
      partitionKey: {
        name: "itemId",
        type: AttributeType.STRING,
      },
      tableName: "items",
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
    });

  }
}

const app = new cdk.App();
new HelloCdkStack(app, "HelloCdkStack");
app.synth();