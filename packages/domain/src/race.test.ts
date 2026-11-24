import { describe, expect, it } from 'vitest';
import { Greyhound, Guy, MAX_BET, MIN_BET, Race, sequenceRandom } from './index';

describe('Greyhound', () => {
  it('avança de 1 a 4 casas e para na linha de chegada', () => {
    const dog = new Greyhound({ number: 1, name: 'X', racetrackLength: 6, random: sequenceRandom([4]) });
    expect(dog.run()).toBe(false);
    expect(dog.location).toBe(4);
    expect(dog.run()).toBe(true);
    expect(dog.location).toBe(6);
    dog.takeStartingPosition();
    expect(dog.location).toBe(0);
  });

  it('nunca anda menos de 1 nem mais de 4', () => {
    const dog = new Greyhound({ number: 1, name: 'X', racetrackLength: 100, random: sequenceRandom([0, 9]) });
    dog.run();
    expect(dog.location).toBe(1);
    dog.run();
    expect(dog.location).toBe(5);
  });
});

describe('Guy e Bet', () => {
  it('aceita aposta entre R$ 5 e R$ 15 com saldo', () => {
    const guy = new Guy({ name: 'João', cash: 50 });
    expect(guy.placeBet(MIN_BET, 2)).toBe(true);
    expect(guy.betDescription).toBe('João apostou R$ 5 no cão número 2');
    expect(guy.placeBet(MAX_BET, 3)).toBe(true);
    expect(guy.myBet?.dog).toBe(3);
  });

  it('recusa aposta fora da faixa', () => {
    const guy = new Guy({ name: 'Beto', cash: 75 });
    expect(guy.checkBet(4, 1)).toBe('below-minimum');
    expect(guy.checkBet(16, 1)).toBe('above-maximum');
    expect(guy.placeBet(16, 1)).toBe(false);
    expect(guy.myBet).toBeNull();
  });

  it('recusa aposta sem saldo', () => {
    const guy = new Guy({ name: 'Alfredo', cash: 7 });
    expect(guy.checkBet(10, 1)).toBe('not-enough-cash');
    expect(guy.placeBet(10, 1)).toBe(false);
  });

  it('recusa cão que não existe', () => {
    expect(new Guy({ name: 'A', cash: 50 }).checkBet(5, 5)).toBe('invalid-dog');
  });

  it('dobro ou nada: ganha o valor se acertar e perde se errar', () => {
    const winner = new Guy({ name: 'A', cash: 50 });
    winner.placeBet(10, 2);
    expect(winner.collect(2)).toBe(10);
    expect(winner.cash).toBe(60);
    expect(winner.myBet).toBeNull();

    const loser = new Guy({ name: 'B', cash: 50 });
    loser.placeBet(10, 2);
    expect(loser.collect(3)).toBe(-10);
    expect(loser.cash).toBe(40);
  });
});

describe('Race', () => {
  it('só larga com ao menos uma aposta', () => {
    const race = new Race(sequenceRandom([4]));
    expect(race.canStart).toBe(false);
    race.guys[0]!.placeBet(5, 1);
    expect(race.canStart).toBe(true);
  });

  it('corre até um vencedor e paga as apostas', () => {
    const race = new Race(sequenceRandom([4, 1, 1, 1, 0]));
    race.dogs.forEach((dog) => (dog.racetrackLength = 4));
    race.guys[0]!.placeBet(10, 1);
    race.guys[1]!.placeBet(15, 2);
    const result = race.runToEnd();
    expect(result.winner).toBe(1);
    expect(race.guys[0]!.cash).toBe(60);
    expect(race.guys[1]!.cash).toBe(60);
    expect(result.bets).toEqual([
      { bettor: 'João', amount: 10, dog: 1, delta: 10 },
      { bettor: 'Beto', amount: 15, dog: 2, delta: -15 },
    ]);
    expect(race.running).toBe(false);
  });

  it('em empate no mesmo passo, sorteia entre os que cruzaram', () => {
    const race = new Race(sequenceRandom([4, 4, 4, 4, 2]));
    race.dogs.forEach((dog) => (dog.racetrackLength = 4));
    race.start();
    expect(race.step()).toBe(3);
  });
});
