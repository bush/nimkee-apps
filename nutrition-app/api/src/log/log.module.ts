import { Module } from '@nestjs/common';
import { LogController } from './log.controller';
import { LogService } from './log.service';
import { FoodModule } from '../food/food.module';

@Module({ imports: [FoodModule], controllers: [LogController], providers: [LogService] })
export class LogModule {}
