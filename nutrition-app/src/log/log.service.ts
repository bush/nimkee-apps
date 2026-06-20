import { Injectable } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { LogEntry, Totals } from '../types';
import * as crypto from 'crypto';

@Injectable()
export class LogService {
  constructor(private readonly storage: StorageService) {}

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  addEntry(foodName: string, servings: number, date?: string): LogEntry {
    const day = date ?? this.today();
    const food = this.storage.getFood(foodName);
    if (!food) throw new Error(`Food "${foodName}" not found. Add it first with: nutri food add`);

    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      foodName: foodName.toLowerCase(),
      food,
      servings,
    };

    const log = this.storage.getDayLog(day);
    log.entries.push(entry);
    this.storage.saveDayLog(log);
    return entry;
  }

  removeEntry(id: string, date?: string): boolean {
    const day = date ?? this.today();
    const log = this.storage.getDayLog(day);
    const before = log.entries.length;
    log.entries = log.entries.filter((e) => !e.id.startsWith(id));
    if (log.entries.length === before) return false;
    this.storage.saveDayLog(log);
    return true;
  }

  getEntries(date?: string): LogEntry[] {
    return this.storage.getDayLog(date ?? this.today()).entries;
  }

  getTotals(date?: string): Totals {
    const entries = this.getEntries(date);
    return entries.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.food.calories * entry.servings,
        protein: acc.protein + entry.food.protein * entry.servings,
        carbs: acc.carbs + entry.food.carbs * entry.servings,
        fat: acc.fat + entry.food.fat * entry.servings,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }
}
