import { Transport } from '@nestjs/microservices';
import { ServiceBusModule } from '@app/service-bus';

// Local provider
import {
    LocalEventModule, LocalServiceBusClient,
    P2pServiceBusClient, P2pServiceBusClientModule
}
    from '@app/service-bus';


// Maps command names to transport names (defined in transports).
// Commands not listed here default to local (EventEmitter2).
// When a service is extracted from the monolith, add its commands here
// to route them to the appropriate remote transport.
const serviceMap = {
    'process-payment': 'p2p',
}

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
    local: LocalServiceBusClient,
    transports: { 'p2p': P2pServiceBusClient },
    serviceMap,
})