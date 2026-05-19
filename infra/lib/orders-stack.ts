import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import * as path from 'path';

export class OrdersStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- Messaging ---

    const topic = new sns.Topic(this, 'OrdersTopic', {
      topicName: 'nimkee-orders-events',
    });

    // Orders Lambda reads from this queue
    const ordersQueue = new sqs.Queue(this, 'OrdersQueue', {
      queueName: 'nimkee-orders-events',
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    // SNS publishes to the orders queue
    topic.addSubscription(new snsSubscriptions.SqsSubscription(ordersQueue));

    // Proxy Lambda polls this queue for replies (short retention — responses are transient)
    const replyQueue = new sqs.Queue(this, 'OrdersReplyQueue', {
      queueName: 'nimkee-orders-replies',
      retentionPeriod: cdk.Duration.seconds(300),
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    // --- Orders Lambda (SQS consumer) ---

    const ordersFunction = new lambda.Function(this, 'OrdersFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../apis/dist/apps/orders')),
      handler: 'main-sls-sqs.handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        NODE_ENV: 'production',
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        SQS_QUEUE_URL: ordersQueue.queueUrl,
      },
    });

    ordersFunction.addEventSource(new lambdaEventSources.SqsEventSource(ordersQueue, {
      batchSize: 10,
      reportBatchItemFailures: true,
    }));

    // Orders Lambda writes replies back to the reply queue
    replyQueue.grantSendMessages(ordersFunction);

    // --- Proxy Lambda (HTTP → SNS → reply queue) ---

    const proxyFunction = new lambda.Function(this, 'OrdersProxyFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../apis/dist/apps/orders')),
      handler: 'main-proxy-sls.handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        NODE_ENV: 'production',
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        SNS_TOPIC_ARN: topic.topicArn,
        SQS_REPLY_QUEUE_URL: replyQueue.queueUrl,
      },
    });

    topic.grantPublish(proxyFunction);
    replyQueue.grantConsumeMessages(proxyFunction);

    // --- API Gateway REST API ---

    const api = new apigateway.RestApi(this, 'OrdersApi', {
      restApiName: 'nimkee-orders-api',
      deployOptions: {
        stageName: 'dev',
      },
    });

    const proxyIntegration = new apigateway.LambdaIntegration(proxyFunction);

    const orders = api.root.addResource('orders');
    orders.addMethod('GET', proxyIntegration);   // GET /orders → list
    orders.addMethod('POST', proxyIntegration);  // POST /orders → create

    const order = orders.addResource('{id}');
    order.addMethod('GET', proxyIntegration);    // GET /orders/:id → get

    // --- EventBridge warming rule (every 5 minutes) ---

    const warmingRule = new events.Rule(this, 'OrdersWarmingRule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
    });
    warmingRule.addTarget(new targets.LambdaFunction(proxyFunction));
    warmingRule.addTarget(new targets.LambdaFunction(ordersFunction));

    // --- Outputs ---

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'Orders API Gateway URL',
    });

    new cdk.CfnOutput(this, 'TopicArn', {
      value: topic.topicArn,
      description: 'Orders SNS Topic ARN',
    });
  }
}
