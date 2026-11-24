import { useState } from 'react';
import { MAX_BET, MIN_BET, type BetRefusal, type Greyhound, type Guy } from '@lab/domain';
import { brl, DOG_COLORS, GUY_COLORS } from '../theme';

const REFUSAL_TEXT: Record<BetRefusal, string> = {
  'below-minimum': `A aposta mínima é ${brl(MIN_BET)}.`,
  'above-maximum': `A aposta máxima é ${brl(MAX_BET)}.`,
  'not-enough-cash': 'Saldo insuficiente para esse valor.',
  'invalid-dog': 'Escolha um cão de 1 a 4.',
};

interface Props {
  guys: Guy[];
  dogs: Greyhound[];
  running: boolean;
  canStart: boolean;
  onBet: (guyIndex: number, amount: number, dog: number) => boolean;
  onClear: (guyIndex: number) => void;
  onStart: () => void;
}

/** O balcão de apostas: escolhe o apostador, o valor e o cão, e larga a corrida. */
export function BettingCounter({ guys, dogs, running, canStart, onBet, onClear, onStart }: Props) {
  const [selected, setSelected] = useState(0);
  const [amount, setAmount] = useState(MIN_BET);
  const [dog, setDog] = useState(1);
  const [message, setMessage] = useState<string | null>(null);

  const guy = guys[selected];
  const refusal = guy ? guy.checkBet(amount, dog) : null;
  const broke = (g: Guy) => g.cash < MIN_BET;

  const changeAmount = (value: number) => {
    setMessage(null);
    setAmount(Math.min(MAX_BET, Math.max(MIN_BET, Math.round(value) || MIN_BET)));
  };

  const bet = () => {
    if (refusal) {
      setMessage(REFUSAL_TEXT[refusal]);
      return;
    }
    if (onBet(selected, amount, dog)) {
      setMessage(null);
      const next = guys.findIndex((g, i) => i > selected && !g.myBet && !broke(g));
      if (next !== -1) setSelected(next);
    }
  };

  return (
    <section className="counter card" aria-labelledby="counter-title">
      <header className="card-header">
        <h2 id="counter-title">Balcão de apostas</h2>
        <span className="muted">
          De {brl(MIN_BET)} a {brl(MAX_BET)} · dobro ou nada
        </span>
      </header>

      <div className="guys" role="radiogroup" aria-label="Apostador">
        {guys.map((g, i) => (
          <button
            key={g.name}
            type="button"
            role="radio"
            aria-checked={selected === i}
            className={`guy${selected === i ? ' is-selected' : ''}${broke(g) && !g.myBet ? ' is-broke' : ''}`}
            style={{ ['--guy' as string]: GUY_COLORS[i] }}
            disabled={running}
            onClick={() => {
              setSelected(i);
              setMessage(null);
            }}
          >
            <span className="avatar">{g.name[0]}</span>
            <span className="guy-info">
              <span className="guy-name">{g.name}</span>
              <span className="guy-cash">{brl(g.cash)}</span>
            </span>
            {g.myBet ? (
              <span className="bet-chip" style={{ ['--dog' as string]: DOG_COLORS[g.myBet.dog] }}>
                {brl(g.myBet.amount)} no {g.myBet.dog}
              </span>
            ) : (
              <span className="bet-chip is-empty">{broke(g) ? 'sem saldo' : 'sem aposta'}</span>
            )}
          </button>
        ))}
      </div>

      {guy && (
        <div className="bet-form">
          <div className="field">
            <label htmlFor="amount">Valor da aposta de {guy.name}</label>
            <div className="stepper">
              <button type="button" aria-label="Diminuir" disabled={running || amount <= MIN_BET} onClick={() => changeAmount(amount - 1)}>
                −
              </button>
              <input
                id="amount"
                type="number"
                min={MIN_BET}
                max={MAX_BET}
                value={amount}
                disabled={running}
                onChange={(e) => changeAmount(Number(e.target.value))}
              />
              <button type="button" aria-label="Aumentar" disabled={running || amount >= MAX_BET} onClick={() => changeAmount(amount + 1)}>
                +
              </button>
            </div>
            <input
              className="range"
              type="range"
              min={MIN_BET}
              max={MAX_BET}
              value={amount}
              disabled={running}
              aria-label="Valor da aposta"
              onChange={(e) => changeAmount(Number(e.target.value))}
            />
          </div>

          <div className="field">
            <span className="label">No cão</span>
            <div className="dog-picker" role="radiogroup" aria-label="Cão">
              {dogs.map((d) => (
                <button
                  key={d.number}
                  type="button"
                  role="radio"
                  aria-checked={dog === d.number}
                  className={`dog-chip${dog === d.number ? ' is-selected' : ''}`}
                  style={{ ['--dog' as string]: DOG_COLORS[d.number] }}
                  disabled={running}
                  onClick={() => {
                    setDog(d.number);
                    setMessage(null);
                  }}
                >
                  <strong>{d.number}</strong>
                  <span>{d.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bet-actions">
            <button type="button" className="btn btn-secondary" disabled={running} onClick={bet}>
              {guy.myBet ? 'Trocar aposta' : 'Apostar'}
            </button>
            {guy.myBet && (
              <button type="button" className="btn btn-ghost" disabled={running} onClick={() => onClear(selected)}>
                Cancelar aposta
              </button>
            )}
          </div>
          <p className="hint" role="alert">
            {message ?? (refusal && refusal !== 'invalid-dog' ? REFUSAL_TEXT[refusal] : ' ')}
          </p>
        </div>
      )}

      <button type="button" className="btn btn-primary btn-start" disabled={!canStart} onClick={onStart}>
        {running ? 'Correndo…' : 'Corram! 🏁'}
      </button>
    </section>
  );
}
