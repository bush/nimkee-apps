export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

export interface SnsClientOptions {
  /** AWS region, e.g. 'us-east-1' */
  region: string;
  /** ARN of the SNS topic to publish events to */
  topicArn: string;
  /** Optional static credentials (falls back to SDK default credential chain) */
  credentials?: AwsCredentials;
  /** Override endpoint URL, useful for LocalStack */
  endpoint?: string;
  /** URL of the SQS queue to poll for request/reply responses */
  replyQueueUrl?: string;
  /** Timeout in ms for waiting for a reply (default: 30000) */
  replyTimeoutMs?: number;
}

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
