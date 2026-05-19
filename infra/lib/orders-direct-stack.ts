import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import * as path from 'path';

export class OrdersDirectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- Orders Lambda (direct invocation) ---

    const ordersFunction = new lambda.Function(this, 'OrdersDirectFunction', {
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

    // --- Proxy Lambda (HTTP → direct Lambda invoke) ---

    const proxyFunction = new lambda.Function(this, 'OrdersDirectProxyFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../apis/dist/apps/orders')),
      handler: 'main-proxy-direct-sls.handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        NODE_ENV: 'production',
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        ORDERS_FUNCTION_NAME: ordersFunction.functionName,
      },
    });

    // Proxy Lambda needs permission to invoke orders Lambda
    ordersFunction.grantInvoke(proxyFunction);

    // --- API Gateway REST API ---

    const api = new apigateway.RestApi(this, 'OrdersDirectApi', {
      restApiName: 'nimkee-orders-direct-api',
      deployOptions: {
        stageName: 'dev',
      },
    });

    const proxyIntegration = new apigateway.LambdaIntegration(proxyFunction);

    const orders = api.root.addResource('orders');
    orders.addMethod('GET', proxyIntegration);
    orders.addMethod('POST', proxyIntegration);

    const order = orders.addResource('{id}');
    order.addMethod('GET', proxyIntegration);

    // --- EventBridge warming rule (every 5 minutes) ---

    const warmingRule = new events.Rule(this, 'OrdersDirectWarmingRule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
    });
    warmingRule.addTarget(new targets.LambdaFunction(proxyFunction));
    warmingRule.addTarget(new targets.LambdaFunction(ordersFunction));

    // --- Outputs ---

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'Orders Direct API Gateway URL',
    });
  }
}
