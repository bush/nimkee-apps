import { Injectable } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { Food } from '../types';

@Injectable()
export class FoodService {
  constructor(private readonly storage: StorageService) {}

  list(): Record<string, Food> {
    return this.storage.getFoods();
  }

  get(name: string): Food | undefined {
    return this.storage.getFood(name);
  }

  add(name: string, food: Food): void {
    this.storage.addFood(name, food);
  }

  remove(name: string): boolean {
    return this.storage.removeFood(name);
  }

  search(query: string): Array<{ key: string; food: Food }> {
    const q = query.toLowerCase();
    return Object.entries(this.storage.getFoods())
      .filter(([key, food]) => key.includes(q) || food.name.toLowerCase().includes(q))
      .map(([key, food]) => ({ key, food }));
  }
}
