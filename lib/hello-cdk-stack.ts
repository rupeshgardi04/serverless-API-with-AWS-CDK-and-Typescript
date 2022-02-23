import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cdk from "aws-cdk-lib";
import { Table, AttributeType, } from "aws-cdk-lib/aws-dynamodb";
import { AssetCode, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import {
  RestApi,
  LambdaIntegration,
  IResource,
  MockIntegration,
  PassthroughBehavior,
} from "aws-cdk-lib/aws-apigateway";
  
export class HelloCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'HelloCdkQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    // To create dynamoDB
    const dynamoTable = new Table(this, "items", {
      partitionKey: {
        name: "itemId",
        type: AttributeType.STRING,
      },
      tableName: "items",
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
    });

    const getItemLambda = new Function(this, "getOneItemFunction", {
      code: new AssetCode("lib/lambda"),
      handler: "get-item.handler",
      runtime: Runtime.NODEJS_14_X,
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        PRIMARY_KEY: "itemId",
      },
    });

    // Giving DynamoDB Table Read permission to Lambda
    dynamoTable.grantReadData(getItemLambda);

    const api = new RestApi(this, "itemsApi", {
      restApiName: "Items Service",
    });

    const items = api.root.addResource("items");

    const singleItem = items.addResource("{id}");
    const getItemIntegration = new LambdaIntegration(getItemLambda);
    singleItem.addMethod("GET", getItemIntegration);
    addCorsOptions(items);

  }
}

export function addCorsOptions(apiResource: IResource) {
  apiResource.addMethod(
    "OPTIONS",
  new MockIntegration({
  integrationResponses: [
  {
  statusCode: "200",
  responseParameters: {
    "method.response.header.Access-Control-Allow-Headers":
    "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
    "method.response.header.Access-Control-Allow-Origin": "'*'",
    "method.response.header.Access-Control-Allow-Credentials":
    "'false'",
    "method.response.header.Access-Control-Allow-Methods":
    "'OPTIONS,GET,PUT,POST,DELETE'",
  },
  },
  ],
  passthroughBehavior: PassthroughBehavior.NEVER,
  requestTemplates: {
    "application/json": '{"statusCode": 200}',
  },
  }),
    {
    methodResponses: [
      {
      statusCode: "200",
        responseParameters: {
        "method.response.header.Access-Control-Allow-Headers": true,
        "method.response.header.Access-Control-Allow-Methods": true,
        "method.response.header.Access-Control-Allow-Credentials": true,
        "method.response.header.Access-Control-Allow-Origin": true,
        },
      },
    ],
    }
  );
}
  
const app = new cdk.App();
new HelloCdkStack(app, "HelloCdkStack");
app.synth();