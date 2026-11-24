import type { RaceResult } from '@lab/domain';
import type { SavedRace, Stats } from '../api';
import { DOG_COLORS, signedBrl } from '../theme';

interface Props {
  lastResult: RaceResult | null;
  races: SavedRace[] | null;
  stats: Stats | null;
  offline: boolean;
}

const time = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** Último resultado, vitórias por cão e histórico salvo no Postgres. */
export function History({ lastResult, races, stats, offline }: Props) {
  const totalWins = stats ? Object.values(stats).reduce((a, b) => a + b, 0) : 0;
  return (
    <aside className="side">
      <section className="card result" aria-live="polite">
        <header className="card-header">
          <h2>Último resultado</h2>
        </header>
        {lastResult ? (
          <ul className="payouts">
            {lastResult.bets.map((b) => (
              <li key={b.bettor}>
                <span>
                  {b.bettor} <span className="muted">no cão {b.dog}</span>
                </span>
                <strong className={b.delta > 0 ? 'gain' : 'loss'}>{signedBrl(b.delta)}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Nenhuma corrida nesta rodada ainda.</p>
        )}
      </section>

      <section className="card">
        <header className="card-header">
          <h2>Vitórias por cão</h2>
          <span className="muted">{totalWins} corridas</span>
        </header>
        <div className="bars">
          {[1, 2, 3, 4].map((n) => {
            const wins = stats?.[n] ?? 0;
            const pct = totalWins ? (wins / totalWins) * 100 : 0;
            return (
              <div key={n} className="bar-row">
                <span className="bar-label" style={{ background: DOG_COLORS[n] }}>
                  {n}
                </span>
                <div className="bar">
                  <div className="bar-fill" style={{ width: `${pct}%`, background: DOG_COLORS[n] }} />
                </div>
                <span className="bar-value">{wins}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <header className="card-header">
          <h2>Histórico</h2>
        </header>
        {offline && <p className="muted">Histórico indisponível: a API não respondeu.</p>}
        {!offline && races?.length === 0 && <p className="muted">As corridas aparecem aqui.</p>}
        <ol className="history">
          {races?.map((race) => (
            <li key={race.id}>
              <span className="history-dog" style={{ background: DOG_COLORS[race.winner] }}>
                {race.winner}
              </span>
              <span className="history-info">
                <strong>Corrida #{race.id}</strong>
                <span className="muted">{time(race.createdAt)}</span>
              </span>
              <span className="history-bets">
                {race.bets.map((b) => (
                  <span key={b.bettor} className={b.delta > 0 ? 'gain' : 'loss'}>
                    {b.bettor[0]} {signedBrl(b.delta)}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  );
}
