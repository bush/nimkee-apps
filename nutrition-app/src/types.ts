export interface Food {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  foodName: string;
  food: Food;
  servings: number;
}

export interface DayLog {
  date: string;
  entries: LogEntry[];
}

export interface Database {
  foods: Record<string, Food>;
  logs: Record<string, DayLog>;
}

export interface Totals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
