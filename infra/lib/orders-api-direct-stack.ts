import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import * as path from 'path';

const integrationResponse = {
  statusCode: '200',
  responseTemplates: { 'application/json': '$input.json("$")' },
};

const methodResponse = {
  statusCode: '200',
  responseModels: { 'application/json': apigateway.Model.EMPTY_MODEL },
};

function lambdaIntegration(
  fn: lambda.IFunction,
  requestTemplate: string,
): apigateway.LambdaIntegration {
  return new apigateway.LambdaIntegration(fn, {
    proxy: false,
    requestTemplates: { 'application/json': requestTemplate },
    integrationResponses: [integrationResponse],
  });
}

export class OrdersApiDirectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- Orders Lambda ---

    const ordersFunction = new lambda.Function(this, 'OrdersApiDirectFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../apis/dist/apps/orders')),
      handler: 'main-sls-direct.handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        NODE_ENV: 'production',
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
    });

    // --- API Gateway with VTL mapping templates ---

    const api = new apigateway.RestApi(this, 'OrdersApiDirect', {
      restApiName: 'nimkee-orders-api-direct',
      deployOptions: { stageName: 'dev' },
    });

    const orders = api.root.addResource('orders');

    // POST /orders → create-order
    orders.addMethod(
      'POST',
      lambdaIntegration(
        ordersFunction,
        '{ "cmd": "create-order", "payload": $input.json("$") }',
      ),
      { methodResponses: [methodResponse] },
    );

    // GET /orders → list-orders
    orders.addMethod(
      'GET',
      lambdaIntegration(
        ordersFunction,
        '{ "cmd": "list-orders", "payload": {} }',
      ),
      { methodResponses: [methodResponse] },
    );

    // GET /orders/{id} → get-order
    const order = orders.addResource('{id}');
    order.addMethod(
      'GET',
      lambdaIntegration(
        ordersFunction,
        '{ "cmd": "get-order", "payload": { "id": "$input.params(\'id\')" } }',
      ),
      { methodResponses: [methodResponse] },
    );

    // --- EventBridge warming rule ---

    const warmingRule = new events.Rule(this, 'OrdersApiDirectWarmingRule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
    });
    warmingRule.addTarget(new targets.LambdaFunction(ordersFunction));

    // --- Outputs ---

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'Orders API Direct URL',
    });
  }
}
