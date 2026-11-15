'use client';
import { useState, useEffect } from 'react';
import { api, Food } from '@/lib/api';
import Link from 'next/link';

const EMPTY = { name: '', calories: '', protein: '', carbs: '', fat: '', serving: '' };

export default function FoodsPage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => api.foods.list(search || undefined).then(setFoods).catch(() => {});
  useEffect(() => { load(); }, [search]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await api.foods.create(form.name.toLowerCase(), {
        name: form.name, calories: parseFloat(form.calories),
        protein: parseFloat(form.protein), carbs: parseFloat(form.carbs),
        fat: parseFloat(form.fat), serving: form.serving,
      });
      setForm(EMPTY); setShowForm(false); load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally { setSaving(false); }
  }

  async function handleRemove(key: string) {
    if (!confirm(`Remove "${key}"?`)) return;
    await api.foods.remove(key); load();
  }

  const field = (placeholder: string, key: keyof typeof form, type = 'text', extra = {}) => (
    <input required type={type} placeholder={placeholder} value={form[key]}
      onChange={e => setForm({ ...form, [key]: e.target.value })}
      className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" {...extra} />
  );

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">Food Database</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          {showForm ? 'Cancel' : '+ Add Custom Food'}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-gray-700">New Food</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">{field('Name', 'name')}</div>
            {field('Calories (kcal)', 'calories', 'number')}
            {field('Serving (e.g. 100g)', 'serving')}
            {field('Protein (g)', 'protein', 'number')}
            {field('Carbs (g)', 'carbs', 'number')}
            <div className="col-span-2">{field('Fat (g)', 'fat', 'number')}</div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40">
            {saving ? 'Saving…' : 'Save Food'}
          </button>
        </form>
      )}

      <input placeholder="Search foods..." value={search} onChange={e => setSearch(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">Serving</th>
              <th className="text-right px-4 py-3">Cal</th>
              <th className="text-right px-4 py-3 hidden sm:table-cell">Pro</th>
              <th className="text-right px-4 py-3 hidden sm:table-cell">Carb</th>
              <th className="text-right px-4 py-3 hidden sm:table-cell">Fat</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {foods.map(f => (
              <tr key={f.key} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{f.name}</td>
                <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{f.serving}</td>
                <td className="px-4 py-3 text-right text-amber-700 font-semibold">{f.calories}</td>
                <td className="px-4 py-3 text-right text-blue-600 hidden sm:table-cell">{f.protein}g</td>
                <td className="px-4 py-3 text-right text-green-600 hidden sm:table-cell">{f.carbs}g</td>
                <td className="px-4 py-3 text-right text-red-500 hidden sm:table-cell">{f.fat}g</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleRemove(f.key)} className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {foods.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No foods found.</p>}
      </div>
    </main>
  );
}
