'use client';
import { useState, useEffect } from 'react';
import { api, Food } from '@/lib/api';

export function AddEntryForm({ onAdded }: { onAdded: () => void }) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState('');
  const [selectedKey, setSelectedKey] = useState('');
  const [servings, setServings] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.foods.list(search || undefined).then(setFoods).catch(() => {}); }, [search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedKey) return;
    setLoading(true); setError('');
    try {
      await api.log.add(selectedKey, parseFloat(servings));
      setSelectedKey(''); setServings('1'); setSearch(''); onAdded();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add entry');
    } finally { setLoading(false); }
  }

  const selected = foods.find(f => f.key === selectedKey);

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder="Search food..." value={search}
        onChange={e => { setSearch(e.target.value); setSelectedKey(''); }}
      />
      {foods.length > 0 && !selectedKey && (
        <ul className="border rounded-lg divide-y max-h-48 overflow-y-auto text-sm">
          {foods.map(f => (
            <li key={f.key} className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex justify-between"
              onClick={() => { setSelectedKey(f.key); setSearch(f.name); }}>
              <span>{f.name}</span>
              <span className="text-gray-400">{f.calories} kcal / {f.serving}</span>
            </li>
          ))}
        </ul>
      )}
      {selected && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          <strong>{selected.name}</strong> — {selected.calories} kcal | P {selected.protein}g | C {selected.carbs}g | F {selected.fat}g per {selected.serving}
        </p>
      )}
      <div className="flex gap-2 items-center">
        <label className="text-sm text-gray-600 whitespace-nowrap">Servings:</label>
        <input type="number" min="0.1" step="0.1" value={servings} onChange={e => setServings(e.target.value)}
          className="w-24 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <button type="submit" disabled={!selectedKey || loading}
          className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40">
          {loading ? 'Adding…' : 'Add to Log'}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>
  );
}
