'use client';
import { useState, useEffect, useCallback } from 'react';
import { api, LogEntry, Totals } from '@/lib/api';
import { MacroTotals } from '@/components/MacroTotals';
import { AddEntryForm } from '@/components/AddEntryForm';
import { FoodLog } from '@/components/FoodLog';
import Link from 'next/link';

const EMPTY: Totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
const todayStr = () => new Date().toISOString().split('T')[0];

export default function Dashboard() {
  const [date, setDate] = useState(todayStr());
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [totals, setTotals] = useState<Totals>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [e, t] = await Promise.all([api.log.entries(date), api.log.totals(date)]);
      setEntries(e); setTotals(t);
    } catch {}
    setLoading(false);
  }, [date]);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleRemove(id: string) { await api.log.remove(id, date); refresh(); }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Nutrition Tracker</h1>
        <Link href="/foods" className="text-sm text-blue-600 hover:underline">Food Database →</Link>
      </header>

      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">Date:</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        {date !== todayStr() && (
          <button onClick={() => setDate(todayStr())} className="text-xs text-blue-600 hover:underline">Back to today</button>
        )}
      </div>

      <section className="bg-white rounded-2xl shadow-sm border p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Daily Totals</h2>
        <MacroTotals totals={totals} />
      </section>

      <section className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Add Food</h2>
        <AddEntryForm onAdded={refresh} />
      </section>

      <section className="bg-white rounded-2xl shadow-sm border p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Log {loading && <span className="text-gray-300 font-normal ml-1">loading…</span>}
        </h2>
        <FoodLog entries={entries} onRemove={handleRemove} />
      </section>
    </main>
  );
}
