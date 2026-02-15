import { Transport } from '@nestjs/microservices';
import { ServiceBusModule } from '@app/service-bus';

// Local provider
import {
    LocalEventModule, LocalServiceBusClient,
    P2pServiceBusClient, P2pServiceBusClientModule
}
    from '@app/service-bus';

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
    publishers: [LocalServiceBusClient, P2pServiceBusClient],
})