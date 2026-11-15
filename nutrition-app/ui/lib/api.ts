const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface Food { key: string; name: string; calories: number; protein: number; carbs: number; fat: number; serving: string; }
export interface LogEntry { id: string; timestamp: string; foodName: string; food: Food; servings: number; }
export interface Totals { calories: number; protein: number; carbs: number; fat: number; }

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) { const body = await res.text(); throw new Error(body || res.statusText); }
  return res.json();
}

export const api = {
  foods: {
    list: (search?: string) => req<Food[]>(`/foods${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    create: (key: string, data: Omit<Food, 'key'>) => req<Food>(`/foods/${encodeURIComponent(key)}`, { method: 'POST', body: JSON.stringify(data) }),
    remove: (key: string) => req<void>(`/foods/${encodeURIComponent(key)}`, { method: 'DELETE' }),
  },
  log: {
    entries: (date?: string) => req<LogEntry[]>(`/log${date ? `?date=${date}` : ''}`),
    totals: (date?: string) => req<Totals>(`/log/totals${date ? `?date=${date}` : ''}`),
    add: (foodKey: string, servings: number, date?: string) => req<LogEntry>('/log', { method: 'POST', body: JSON.stringify({ foodKey, servings, date }) }),
    remove: (id: string, date?: string) => req<void>(`/log/${id}${date ? `?date=${date}` : ''}`, { method: 'DELETE' }),
  },
};
