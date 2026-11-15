'use client';
import { LogEntry } from '@/lib/api';

export function FoodLog({ entries, onRemove }: { entries: LogEntry[]; onRemove: (id: string) => void }) {
  if (entries.length === 0)
    return <p className="text-gray-400 text-sm text-center py-6">No entries yet. Add a food above.</p>;
  return (
    <ul className="divide-y">
      {entries.map(e => {
        const cals = (e.food.calories * e.servings).toFixed(1);
        return (
          <li key={e.id} className="flex items-center justify-between py-3 text-sm">
            <div>
              <p className="font-medium">{e.food.name}</p>
              <p className="text-gray-400 text-xs">
                x{e.servings} — P {(e.food.protein * e.servings).toFixed(1)}g · C {(e.food.carbs * e.servings).toFixed(1)}g · F {(e.food.fat * e.servings).toFixed(1)}g
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-amber-700">{cals} kcal</span>
              <button onClick={() => onRemove(e.id)} className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
