import { Module } from '@nestjs/common';
import { StorageService } from './storage/storage.service';
import { FoodService } from './food/food.service';
import { LogService } from './log/log.service';

@Module({
  providers: [StorageService, FoodService, LogService],
  exports: [FoodService, LogService],
})
export class AppModule {}
