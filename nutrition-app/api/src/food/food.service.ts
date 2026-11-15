import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { Food } from '../types';
import { CreateFoodDto } from './dto/create-food.dto';

@Injectable()
export class FoodService {
  constructor(private readonly storage: StorageService) {}

  findAll(search?: string) {
    const entries = Object.entries(this.storage.getFoods()).map(([key, food]) => ({ key, ...food }));
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(f => f.key.includes(q) || f.name.toLowerCase().includes(q));
  }

  findOne(key: string): Food {
    const food = this.storage.getFood(key);
    if (!food) throw new NotFoundException(`Food "${key}" not found`);
    return food;
  }

  create(key: string, dto: CreateFoodDto): Food {
    const food: Food = { ...dto };
    this.storage.addFood(key, food);
    return food;
  }

  remove(key: string) {
    if (!this.storage.removeFood(key)) throw new NotFoundException(`Food "${key}" not found`);
  }
}
