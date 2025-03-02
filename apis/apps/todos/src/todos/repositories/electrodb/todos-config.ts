import { Entity, Schema } from 'electrodb';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

export type TodoEntity = Entity<string, string, string, Schema<string, string, string>>;

@Injectable()
export class TodoConfig {

  public readonly entity: TodoEntity;

  constructor(config: ConfigService, client: DynamoDBClient) {
    this.entity = new Entity<string, string, string, Schema<string, string, string>>({
      model: {
        entity: 'Todo',
        version: '1',
        service: 'TodoApp',
      },
      attributes: {
        id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        isCompleted: { type: 'boolean' },
      },
      indexes: {
        primary: {
          pk: { field: config.get<string>('TODO_TABLE_PKNAME'), composite: [] },
          sk: { field: config.get<string>('TODO_TABLE_SKNAME'), composite: ['id'] },
        },
      },
    }, { table: config.get<string>('TODO_TABLE_TABLENAME'), client });
  }
}