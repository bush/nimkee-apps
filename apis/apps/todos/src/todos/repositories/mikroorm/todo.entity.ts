import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'todos' })
export class TodoEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property()
  title!: string;

  @Property({ nullable: true })
  description?: string;

  @Property()
  isCompleted!: boolean;
}
