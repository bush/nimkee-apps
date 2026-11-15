'use client';
import { Totals } from '@/lib/api';

export function MacroTotals({ totals }: { totals: Totals }) {
  const items = [
    { label: 'Calories', value: totals.calories, unit: 'kcal', cls: 'bg-amber-100 text-amber-800' },
    { label: 'Protein',  value: totals.protein,  unit: 'g',    cls: 'bg-blue-100 text-blue-800' },
    { label: 'Carbs',    value: totals.carbs,     unit: 'g',    cls: 'bg-green-100 text-green-800' },
    { label: 'Fat',      value: totals.fat,       unit: 'g',    cls: 'bg-red-100 text-red-800' },
  ];
  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map(({ label, value, unit, cls }) => (
        <div key={label} className={`flex flex-col items-center rounded-xl p-4 ${cls}`}>
          <span className="text-2xl font-bold">{value.toFixed(1)}</span>
          <span className="text-sm opacity-80">{unit}</span>
          <span className="text-xs mt-1 font-medium uppercase tracking-wide">{label}</span>
        </div>
      ))}
    </div>
  );
}
