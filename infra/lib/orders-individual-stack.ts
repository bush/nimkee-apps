import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import * as path from 'path';

const distPath = path.join(__dirname, '../../apis/dist/apps/orders');

const integrationResponse = {
  statusCode: '200',
  responseTemplates: { 'application/json': '$input.json("$")' },
};

const methodResponse = {
  statusCode: '200',
  responseModels: { 'application/json': apigateway.Model.EMPTY_MODEL },
};

export class OrdersIndividualStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaDefaults = {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(distPath),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        NODE_ENV: 'production',
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
    };

    const createOrderFn = new lambda.Function(this, 'CreateOrderFn', {
      ...lambdaDefaults,
      handler: 'main-sls-create-order.handler',
    });

    const getOrderFn = new lambda.Function(this, 'GetOrderFn', {
      ...lambdaDefaults,
      handler: 'main-sls-get-order.handler',
    });

    const listOrdersFn = new lambda.Function(this, 'ListOrdersFn', {
      ...lambdaDefaults,
      handler: 'main-sls-list-orders.handler',
    });

    // --- API Gateway ---

    const api = new apigateway.RestApi(this, 'OrdersIndividualApi', {
      restApiName: 'nimkee-orders-individual-api',
      deployOptions: { stageName: 'dev' },
    });

    const orders = api.root.addResource('orders');

    orders.addMethod('POST',
      new apigateway.LambdaIntegration(createOrderFn, {
        proxy: false,
        requestTemplates: { 'application/json': '$input.json("$")' },
        integrationResponses: [integrationResponse],
      }),
      { methodResponses: [methodResponse] },
    );

    orders.addMethod('GET',
      new apigateway.LambdaIntegration(listOrdersFn, {
        proxy: false,
        requestTemplates: { 'application/json': '{}' },
        integrationResponses: [integrationResponse],
      }),
      { methodResponses: [methodResponse] },
    );

    const order = orders.addResource('{id}');
    order.addMethod('GET',
      new apigateway.LambdaIntegration(getOrderFn, {
        proxy: false,
        requestTemplates: { 'application/json': '{ "id": "$input.params(\'id\')" }' },
        integrationResponses: [integrationResponse],
      }),
      { methodResponses: [methodResponse] },
    );

    // --- EventBridge warming rule ---

    const warmingRule = new events.Rule(this, 'OrdersIndividualWarmingRule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
    });
    warmingRule.addTarget(new targets.LambdaFunction(createOrderFn));
    warmingRule.addTarget(new targets.LambdaFunction(getOrderFn));
    warmingRule.addTarget(new targets.LambdaFunction(listOrdersFn));

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'Orders Individual Lambda API URL',
    });
  }
}
