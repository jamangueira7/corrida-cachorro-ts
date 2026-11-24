import type { Greyhound } from '@lab/domain';
import { DOG_COLORS } from '../theme';
import { DogIcon } from './DogIcon';

interface Props {
  dogs: Greyhound[];
  running: boolean;
  winner: number | null;
}

/** A pista: uma raia por cão, largada à esquerda e linha de chegada quadriculada à direita. */
export function Track({ dogs, running, winner }: Props) {
  const winnerDog = dogs.find((d) => d.number === winner);
  return (
    <section className="track card" aria-label="Pista de corrida">
      <div className="track-lanes">
        {dogs.map((dog) => (
          <div key={dog.number} className={`lane${winner === dog.number ? ' is-winner' : ''}`}>
            <span className="lane-number" style={{ background: DOG_COLORS[dog.number] }}>
              {dog.number}
            </span>
            <span className="lane-name">{dog.name}</span>
            <div className="lane-run">
              <div className="dog" style={{ left: `calc(${dog.progress * 100}% - ${dog.progress * 96}px)` }}>
                <DogIcon color={DOG_COLORS[dog.number] ?? '#333'} number={dog.number} running={running} />
              </div>
            </div>
          </div>
        ))}
        <div className="start-line" aria-hidden="true" />
        <div className="finish-line" aria-hidden="true" />
      </div>
      <div className="track-status" aria-live="polite">
        {running && <span className="pill pill-live">● Valendo! Os cães estão na pista</span>}
        {!running && winnerDog && (
          <span className="pill pill-win" style={{ ['--dog' as string]: DOG_COLORS[winnerDog.number] }}>
            🏆 Cão {winnerDog.number} · {winnerDog.name} venceu!
          </span>
        )}
        {!running && !winnerDog && <span className="pill">Façam suas apostas e larguem os cães</span>}
      </div>
    </section>
  );
}
