import { Transport } from '@nestjs/microservices';
import { ServiceBusModule } from '@app/service-bus';

// Local provider
import { LocalEventPublisher } from './service-bus/local/local';
import { LocalEventModule } from "./service-bus/local/local.module";

// TCP transport provider
import { P2pServiceBusClient } from '@app/service-bus/p2p/p2p-client';
import { P2pServiceBusClientModule } from '@app/service-bus/p2p/p2p-client.module';

// Wire up the clients
export const serviceBusModule = ServiceBusModule.register({
    imports: [
        LocalEventModule,
        P2pServiceBusClientModule.register({
            name: 'P2P_SERVICE_BUS_CLIENT',
            transport: Transport.TCP,
            options: { host: '127.0.0.1', port: 3002 },
        }),
    ],
    publishers: [LocalEventPublisher, P2pServiceBusClient],
})