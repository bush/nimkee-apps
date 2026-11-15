import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { LogEntry, Totals } from '../types';
import * as crypto from 'crypto';
import { AddEntryDto } from './dto/add-entry.dto';

@Injectable()
export class LogService {
  constructor(private readonly storage: StorageService) {}

  private today() { return new Date().toISOString().split('T')[0]; }

  getEntries(date?: string): LogEntry[] { return this.storage.getDayLog(date ?? this.today()).entries; }

  getTotals(date?: string): Totals {
    return this.getEntries(date).reduce(
      (acc, e) => ({
        calories: acc.calories + e.food.calories * e.servings,
        protein: acc.protein + e.food.protein * e.servings,
        carbs: acc.carbs + e.food.carbs * e.servings,
        fat: acc.fat + e.food.fat * e.servings,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }

  addEntry(dto: AddEntryDto): LogEntry {
    const food = this.storage.getFood(dto.foodKey);
    if (!food) throw new NotFoundException(`Food "${dto.foodKey}" not found`);
    const date = dto.date ?? this.today();
    const entry: LogEntry = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), foodName: dto.foodKey.toLowerCase(), food, servings: dto.servings };
    const log = this.storage.getDayLog(date);
    log.entries.push(entry);
    this.storage.saveDayLog(log);
    return entry;
  }

  removeEntry(id: string, date?: string) {
    const day = date ?? this.today();
    const log = this.storage.getDayLog(day);
    const before = log.entries.length;
    log.entries = log.entries.filter(e => e.id !== id);
    if (log.entries.length === before) throw new NotFoundException(`Entry "${id}" not found`);
    this.storage.saveDayLog(log);
  }
}
