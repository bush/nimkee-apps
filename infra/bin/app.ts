#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MonolithStack } from '../lib/monolith-stack';
import { OrdersStack } from '../lib/orders-stack';
import { OrdersDirectStack } from '../lib/orders-direct-stack';
import { OrdersApiDirectStack } from '../lib/orders-api-direct-stack';
import { OrdersIndividualStack } from '../lib/orders-individual-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

new MonolithStack(app, 'MonolithStack', { env });
new OrdersStack(app, 'OrdersStack', { env });
new OrdersDirectStack(app, 'OrdersDirectStack', { env });
new OrdersApiDirectStack(app, 'OrdersApiDirectStack', { env });
new OrdersIndividualStack(app, 'OrdersIndividualStack', { env });
