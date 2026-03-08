
// This is for build-time configuration.  Here we can wire out modules in various ways
// depending on which adapters we want to use.

// Repository Providers

// DynamoDB Support
import { ConfigService } from '@nestjs/config';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { TodosElectroDBRepoModule } from './todos/repositories/electrodb/todos-repository.module';

// Here we can switch to the remote dynambo db configuration when we deploy to production.

// Local DynamoDB (local dev / testing):
const dynamodbDocumentProvider = {
    provide: DynamoDBDocument,
    useFactory: (config: ConfigService) => {
        const client = new DynamoDBClient({
            endpoint: config.get<string>('ENDPOINT'),
            region: config.get<string>('DEFAULT_REGION'),
            credentials: {
                accessKeyId: config.get<string>('ACCESS_KEY_ID') || '',
                secretAccessKey: config.get<string>('SECRET_ACCESS_KEY') || ''
            }
        });
        return DynamoDBDocument.from(client);
    }, inject: [ConfigService]
};

// OR

// AWS Hosted DynamoDB (production):
// const dynamodbDocumentProvider = {
//    provide: DynamoDBDocument,
//    useValue: DynamoDBDocument.from(new DynamoDBClient({}))
// }

export const todosRepositoryModule = TodosElectroDBRepoModule.register(dynamodbDocumentProvider);

// MikroORM SQLite (local dev / testing):
// import { TodosMikroORMRepoModule } from './todos/repositories/mikroorm/todos-repository.module';
// import { SqliteDriver } from '@mikro-orm/better-sqlite';
// export const todosRepositoryModule = TodosMikroORMRepoModule.register({
//   driver: SqliteDriver,
//   dbName: 'todos.db',
// });

// OR

// MikroORM PostgreSQL (production):
// import { PostgreSqlDriver } from '@mikro-orm/postgresql';
// export const todosRepositoryModule = TodosMikroORMRepoModule.register({
//   driver: PostgreSqlDriver,
//   host: process.env.DB_HOST,
//   dbName: process.env.DB_NAME,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
// });

// Configure other adapters here ...

