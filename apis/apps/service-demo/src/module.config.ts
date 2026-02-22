import { Transport } from '@nestjs/microservices';

import { P2pServiceBusClient } from './service-bus/p2p/p2p-client';
import { P2pServiceBusClientModule } from "./service-bus/p2p/p2p-client.module";
import { LocalEventPublisher } from './service-bus/local/local';
import { ServiceBusModule } from "./service-bus/service-bus.module";
import { LocalEventModule } from "./service-bus/local/local.module";
import { SnsServiceBusClient, SnsServiceBusClientModule } from '@app/sns-sqs';

export const serviceBusModule = ServiceBusModule.register({
    imports: [
        LocalEventModule,
        P2pServiceBusClientModule.register({
            name: 'P2P_SERVICE_BUS_CLIENT',
            transport: Transport.TCP,
            options: { host: '127.0.0.1', port: 3002 },
        }),
        SnsServiceBusClientModule.register({
            region: process.env.AWS_REGION ?? 'us-east-1',
            topicArn: process.env.SNS_TOPIC_ARN ?? '',
            endpoint: process.env.AWS_ENDPOINT_URL,
        }),
    ],
    publishers: [LocalEventPublisher, P2pServiceBusClient, SnsServiceBusClient],
})