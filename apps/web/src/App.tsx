import { useCallback, useEffect, useState } from 'react';
import type { RaceResult } from '@lab/domain';
import { api, type SavedRace, type Stats } from './api';
import { BettingCounter } from './components/BettingCounter';
import { History } from './components/History';
import { Track } from './components/Track';
import { useRace } from './useRace';

export function App() {
  const [races, setRaces] = useState<SavedRace[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, s] = await Promise.all([api.races(), api.stats()]);
      setRaces(r);
      setStats(s);
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onFinish = useCallback(
    (result: RaceResult) => {
      api.saveRace(result).then(load, () => setOffline(true));
    },
    [load],
  );

  const { race, winner, lastResult, start, placeBet, clearBet, reset } = useRace(onFinish);

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            🏁
          </span>
          <div>
            <h1>Um Dia de Corridas</h1>
            <p>Salão de apostas de galgos · Laboratório 1 em TypeScript</p>
          </div>
        </div>
        <button type="button" className="btn btn-ghost" disabled={race.running} onClick={reset}>
          Nova rodada
        </button>
      </header>

      <main className="layout">
        <Track dogs={race.dogs} running={race.running} winner={winner} />
        <div className="columns">
          <BettingCounter
            guys={race.guys}
            dogs={race.dogs}
            running={race.running}
            canStart={race.canStart}
            onBet={placeBet}
            onClear={clearBet}
            onStart={start}
          />
          <History lastResult={lastResult} races={races} stats={stats} offline={offline} />
        </div>
      </main>
    </div>
  );
}
