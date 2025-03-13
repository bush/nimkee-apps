
import { ConfigService } from '@nestjs/config';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Logger, Provider } from '@nestjs/common';

export const localDocClientProvider: Provider<DynamoDBDocument> = {
    provide: DynamoDBDocument,
    useFactory: (config: ConfigService) => {
        const name = "localDocClient";
        Logger.log(`Using local ${name} provider`, name);
        Logger.log(`📋 Dynamodb ENDPOINT: ${config.get<string>('ENDPOINT')}`, name);
        Logger.log(`📋 Dynamodb TODO_TABLE_REGION: ${config.get<string>('TODO_TABLE_REGION')}`, name);
        Logger.log(`ENDPOINT: ${config.get<string>('ENDPOINT')}`, name);
        Logger.log(`DEFAULT_REGION': ${config.get<string>('DEFAULT_REGION')}`, name);
        Logger.log(`ACCESS_KEY_ID': ${config.get<string>('ACCESS_KEY_ID')}`, name);
        Logger.log(`SECRET_ACCESS_KEY': ${config.get<string>('SECRET_ACCESS_KEY')}`, name);

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
}