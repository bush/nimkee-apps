import { Transport } from '@nestjs/microservices';
import { ServiceBusModule } from '@app/service-bus';

// Local provider
import {
    LocalEventModule, LocalServiceBusClient,
    P2pServiceBusClient, P2pServiceBusClientModule
}
    from '@app/service-bus';


export const remoteP2PPort: number = process.env.P2P_REMOTE_PORT !== undefined ?
    parseInt(process.env.P2P_REMOTE_PORT, 10) : 3002

// Wire up the clients
export const serviceBusModule = ServiceBusModule.register({
    imports: [
        LocalEventModule,
        P2pServiceBusClientModule.register({
            name: 'P2P_SERVICE_BUS_CLIENT',
            transport: Transport.TCP,
            options: { host: '127.0.0.1', port: remoteP2PPort },
        }),
    ],
    localPublisher: LocalServiceBusClient,
    remotePublishers: [P2pServiceBusClient],
})