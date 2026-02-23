## Serivce Bus Demo

The main concept of the service-bus lib is to allow for multiple receivers to transmit events.
So we can have local event listeners and remote event listeners.  When we call publish, events
are published to all listeners, local or remote.  This allows for the expansion of the 'modular monolish'.
The idea being that as modules evolve to their own micro-services the communication mechanism is the same.
Simply create a new micro-service and messages will be received just as they were before when they were modules.


## Instructions

In the case of the TCP transport, each service has to explicitly content to one-another because
there is no message broker.  There is a remote P2P port and a local P2P port.  To run this demo
we simply start the app as mirrors of each other for the P2P ports.


Open a terminal and run:

```
$ cd nimkee-apps/apis
$ HTTP_PORT=3000 P2P_LOCAL_PORT=3001 P2P_REMOTE_PORT=3002 npm run start:dev service-demo
```

Open another terminal and run:

```
$ cd nimkee-apps/apis
$ HTTP_PORT=4000 P2P_LOCAL_PORT=3002 P2P_REMOTE_PORT=3001 npm run start:dev service-demo
```


To exercise the [request-response](https://docs.nestjs.com/microservices/basics#request-response) functionality:

```
curl -X POST http://localhost:3000/send -H "Content-Type: application/json" -d '{"data":{"msg": "Hello, Service!"}}'
```

and of course you can do the same from the other instance of the app but use its http port:

```
$ curl -X POST http://localhost:4000/send -H "Content-Type: application/json" -d '{"data":{"msg": "Hello, Service!"}}'
```

This will post the message then send it to the P2P peer and that peer will response.

If we want to exercise [event-based](https://docs.nestjs.com/microservices/basics#event-based) functionality:

```
curl -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d '{}'
```

This will send events to the local listens and remote listeners. 
  
