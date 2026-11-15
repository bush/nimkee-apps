import { Module } from '@nestjs/common';
import { FoodModule } from './food/food.module';
import { LogModule } from './log/log.module';

@Module({ imports: [FoodModule, LogModule] })
export class AppModule {}
