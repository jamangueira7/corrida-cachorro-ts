import type { BetResult, RaceResult } from '@lab/domain';

export interface SavedRace {
  id: number;
  winner: number;
  createdAt: string;
  bets: BetResult[];
}

export type Stats = Record<string, number>;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export const api = {
  races: () => request<SavedRace[]>('/api/races?limit=8'),
  stats: () => request<Stats>('/api/stats'),
  saveRace: (race: RaceResult) =>
    request<{ id: number }>('/api/races', { method: 'POST', body: JSON.stringify(race) }),
};
