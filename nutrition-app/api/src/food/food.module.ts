import { Module } from '@nestjs/common';
import { FoodController } from './food.controller';
import { FoodService } from './food.service';
import { StorageService } from '../storage/storage.service';

@Module({ controllers: [FoodController], providers: [FoodService, StorageService], exports: [FoodService, StorageService] })
export class FoodModule {}
