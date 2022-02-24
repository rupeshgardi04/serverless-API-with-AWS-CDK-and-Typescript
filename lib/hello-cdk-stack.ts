import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cdk from "aws-cdk-lib";
import { Table, AttributeType } from "aws-cdk-lib/aws-dynamodb";
import { AssetCode, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import {
  RestApi,
  LambdaIntegration,
  IResource,
  MockIntegration,
  PassthroughBehavior,
} from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { join } from 'path'

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

    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      // depsLockFilePath: join(__dirname, 'lambdas', 'package-lock.json'),
      // environment: {
      //   PRIMARY_KEY: 'itemId',
      //   TABLE_NAME: dynamoTable.tableName,
      // },
      runtime: Runtime.NODEJS_14_X,
    }

    // const getOneLambda = new NodejsFunction(this, 'getOneItemFunction', {
    //   entry: join(__dirname, 'lambda', 'get-item.ts'),
    //   ...nodeJsFunctionProps,
    // });

    const createOneLambda = new NodejsFunction(this, 'createItemFunction', {
      entry: join(__dirname, 'lambda', 'create-card.ts'),
      ...nodeJsFunctionProps,
    });

    // const getItemLambda = new Function(this, "getOneItemFunction", {
    //   code: new AssetCode("lib/lambda"),
    //   handler: "get-item.handler",
    //   runtime: Runtime.NODEJS_14_X,
    //   environment: {
    //     TABLE_NAME: dynamoTable.tableName,
    //     PRIMARY_KEY: "itemId",
    //   },
    // });

    // Giving DynamoDB Table Read permission to Lambda
    // dynamoTable.grantReadData(getItemLambda);

    const api = new RestApi(this, "itemsApi", {
      restApiName: "Items Service",
    });

    const items = api.root.addResource("items");
    const cards = api.root.addResource("cards");

    const createOneIntegration = new LambdaIntegration(createOneLambda);
    cards.addMethod('POST', createOneIntegration);
    addCorsOptions(cards);

    // const getOneIntegration = new LambdaIntegration(getOneLambda);

    // const singleItem = items.addResource("{id}");
    // const getItemIntegration = new LambdaIntegration(getItemLambda);
    // singleItem.addMethod("GET", getItemIntegration);
    // addCorsOptions(items);
    
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
