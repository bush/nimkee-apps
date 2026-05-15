import { AwsCredentials } from '@app/service-bus';
export { AwsCredentials, SnsClientOptions } from '@app/service-bus';

export interface SqsServerOptions {
  /** AWS region, e.g. 'us-east-1' */
  region: string;
  /** URL of the SQS queue to poll */
  queueUrl: string;
  /** Optional static credentials (falls back to SDK default credential chain) */
  credentials?: AwsCredentials;
  /** Override endpoint URL, useful for LocalStack */
  endpoint?: string;
  /** Milliseconds between poll cycles (default: 1000) */
  pollingIntervalMs?: number;
  /** SQS long-polling wait time in seconds (default: 20, max: 20) */
  waitTimeSeconds?: number;
  /** Maximum messages to fetch per poll (default: 10, max: 10) */
  maxMessages?: number;
}
