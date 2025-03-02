## Current state
Finish current todos and pause, goal is to quickly multiplex between this and other projects while always keeping the current state documented to multiplex is fast and painless

## Objectives
Get to basic todo app with at least a reusable user microservice and todos 

## Next major topic to flesh out

* Fix various FIXME's throughout the app
* Serverless dynamodb setup
* Complete tests
* General clean up
* Auth Basic
* Auth integration with auth0
* Auth integration with cognito - although this could be a large undertaking
* Microservices - Build example with SQS/SNS

## TODO

Parameterize pk, sk, tablename for the electodb config
Try to rework some of the interfaces as abstract classes or similar
CORS
Helmet


## Modules

The way I am looking at modules, at least initially is a grouping of classes that are required to build up to an interface.  So for example the IRepositoryService interface - for the dynamodb implementation we need to build up collect all the classes/objects that are used to create the implentation.  This module feeds into the next module that needs that interface.