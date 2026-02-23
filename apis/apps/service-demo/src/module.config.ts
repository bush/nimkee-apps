import { Transport } from '@nestjs/microservices';
import {
    ServiceBusModule, TransportType,
    LocalEventModule, LocalServiceBusClient,
    P2pServiceBusClient, P2pServiceBusClientModule,
} from '@app/service-bus';
import { SnsServiceBusClient, SnsServiceBusClientModule } from '@app/sns-sqs';
import { Commands } from './commands';


// Maps command names to transport names (defined in transports).
// Commands not listed here default to local (EventEmitter2).
// When a service is extracted from the monolith, add its commands here
// to route them to the appropriate remote transport.
const serviceMap = {
    [Commands.PROCESS_PAYMENT]: TransportType.SNS_SQS,
}

export const remoteP2PPort: number = process.env.P2P_REMOTE_PORT !== undefined ?
    parseInt(process.env.P2P_REMOTE_PORT, 10) : 3002

const imports: any[] = [
    LocalEventModule,
    SnsServiceBusClientModule.register({
        region: process.env.AWS_REGION ?? 'us-east-1',
        topicArn: process.env.SNS_TOPIC_ARN ?? '',
        endpoint: process.env.AWS_ENDPOINT_URL,
    }),
];

// Uncomment to enable P2P transport
// imports.push(
//     P2pServiceBusClientModule.register({
//         name: 'P2P_SERVICE_BUS_CLIENT',
//         transport: Transport.TCP,
//         options: { host: '127.0.0.1', port: remoteP2PPort },
//     }),
// );

// Wire up the clients
export const serviceBusModule = ServiceBusModule.register({
    imports,
    local: LocalServiceBusClient,
    transports: { [TransportType.SNS_SQS]: SnsServiceBusClient },
    serviceMap,
})
