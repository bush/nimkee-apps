import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Database, Food, DayLog } from '../types';

const DB_PATH = path.join(os.homedir(), '.nutrition-app', 'db.json');

const DEFAULT_FOODS: Record<string, Food> = {
  'chicken breast': { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: '100g' },
  'brown rice': { name: 'Brown Rice', calories: 216, protein: 5, carbs: 45, fat: 1.8, serving: '1 cup cooked' },
  'egg': { name: 'Egg', calories: 78, protein: 6, carbs: 0.6, fat: 5, serving: '1 large' },
  'banana': { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, serving: '1 medium' },
  'apple': { name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, serving: '1 medium' },
  'milk': { name: 'Milk (whole)', calories: 149, protein: 8, carbs: 12, fat: 8, serving: '1 cup' },
  'oats': { name: 'Oats', calories: 307, protein: 11, carbs: 55, fat: 5, serving: '1 cup dry' },
  'salmon': { name: 'Salmon', calories: 208, protein: 20, carbs: 0, fat: 13, serving: '100g' },
  'broccoli': { name: 'Broccoli', calories: 55, protein: 3.7, carbs: 11, fat: 0.6, serving: '1 cup' },
  'greek yogurt': { name: 'Greek Yogurt', calories: 100, protein: 17, carbs: 6, fat: 0.7, serving: '170g' },
  'almonds': { name: 'Almonds', calories: 164, protein: 6, carbs: 6, fat: 14, serving: '28g (1 oz)' },
  'bread': { name: 'Whole Wheat Bread', calories: 69, protein: 3.6, carbs: 12, fat: 1, serving: '1 slice' },
  'pasta': { name: 'Pasta', calories: 220, protein: 8, carbs: 43, fat: 1.3, serving: '1 cup cooked' },
  'potato': { name: 'Potato', calories: 161, protein: 4.3, carbs: 37, fat: 0.2, serving: '1 medium' },
  'tuna': { name: 'Tuna (canned)', calories: 109, protein: 25, carbs: 0, fat: 1, serving: '100g' },
};

@Injectable()
export class StorageService {
  private db: Database;

  constructor() {
    this.db = this.load();
  }

  private load(): Database {
    try {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      if (fs.existsSync(DB_PATH)) {
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      }
    } catch {}
    return { foods: { ...DEFAULT_FOODS }, logs: {} };
  }

  private save(): void {
    fs.writeFileSync(DB_PATH, JSON.stringify(this.db, null, 2));
  }

  getFoods(): Record<string, Food> {
    return this.db.foods;
  }

  getFood(name: string): Food | undefined {
    return this.db.foods[name.toLowerCase()];
  }

  addFood(key: string, food: Food): void {
    this.db.foods[key.toLowerCase()] = food;
    this.save();
  }

  removeFood(key: string): boolean {
    if (!this.db.foods[key.toLowerCase()]) return false;
    delete this.db.foods[key.toLowerCase()];
    this.save();
    return true;
  }

  getDayLog(date: string): DayLog {
    if (!this.db.logs[date]) {
      this.db.logs[date] = { date, entries: [] };
    }
    return this.db.logs[date];
  }

  saveDayLog(log: DayLog): void {
    this.db.logs[log.date] = log;
    this.save();
  }

  getLogs(): Record<string, DayLog> {
    return this.db.logs;
  }
}
