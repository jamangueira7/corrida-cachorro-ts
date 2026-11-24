import { useCallback, useEffect, useRef, useState } from 'react';
import { Race, type RaceResult } from '@lab/domain';

const STEP_MS = 90;

/**
 * Liga o `Race` do domínio ao React. O domínio guarda o estado; o hook só avisa a tela que algo mudou
 * e roda o laço da corrida com uma pausa entre os passos (o `Timer` do WinForms).
 */
export function useRace(onFinish: (result: RaceResult) => void) {
  const raceRef = useRef<Race>(null as unknown as Race);
  if (!raceRef.current) raceRef.current = new Race();
  const race = raceRef.current;

  const [, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const [winner, setWinner] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<RaceResult | null>(null);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    if (!race.running) return;
    const timer = setInterval(() => {
      const found = race.step();
      if (found !== null) {
        clearInterval(timer);
        const result = race.finish(found);
        setWinner(found);
        setLastResult(result);
        onFinishRef.current(result);
      }
      refresh();
    }, STEP_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [race.running, refresh]);

  const start = useCallback(() => {
    if (!race.canStart) return;
    setWinner(null);
    setLastResult(null);
    race.start();
    refresh();
  }, [race, refresh]);

  const placeBet = useCallback(
    (guyIndex: number, amount: number, dog: number) => {
      const guy = race.guys[guyIndex];
      if (!guy || race.running) return false;
      const ok = guy.placeBet(amount, dog);
      refresh();
      return ok;
    },
    [race, refresh],
  );

  const clearBet = useCallback(
    (guyIndex: number) => {
      if (race.running) return;
      race.guys[guyIndex]?.clearBet();
      refresh();
    },
    [race, refresh],
  );

  const reset = useCallback(() => {
    race.reset();
    setWinner(null);
    setLastResult(null);
    refresh();
  }, [race, refresh]);

  return { race, winner, lastResult, start, placeBet, clearBet, reset };
}
