import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Greyhound, Guy, mathRandom } from '@lab/domain';
import { BettingCounter } from './BettingCounter';

const dogs = ['Relâmpago', 'Bolinha', 'Faísca', 'Trovão'].map(
  (name, i) => new Greyhound({ number: i + 1, name, racetrackLength: 100, random: mathRandom }),
);

function setup(guys: Guy[]) {
  const onBet = vi.fn(() => true);
  render(
    <BettingCounter guys={guys} dogs={dogs} running={false} canStart={false} onBet={onBet} onClear={vi.fn()} onStart={vi.fn()} />,
  );
  return { onBet };
}

describe('BettingCounter', () => {
  it('recusa a aposta acima do saldo e mostra a mensagem', async () => {
    const { onBet } = setup([new Guy({ name: 'Zé', cash: 8 })]);
    const amount = screen.getByRole('spinbutton', { name: /Valor da aposta de Zé/ });
    fireEvent.change(amount, { target: { value: '10' } });
    await userEvent.click(screen.getByRole('button', { name: 'Apostar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Saldo insuficiente para esse valor.');
    expect(onBet).not.toHaveBeenCalled();
  });

  it('marca quem está sem saldo para apostar', () => {
    setup([new Guy({ name: 'Zé', cash: 3 })]);
    expect(screen.getByText('sem saldo')).toBeInTheDocument();
  });

  it('entrega valor e cão escolhidos ao fazer a aposta', async () => {
    const { onBet } = setup([new Guy({ name: 'Zé', cash: 40 })]);
    await userEvent.click(screen.getByRole('button', { name: 'Aumentar' }));
    await userEvent.click(screen.getByRole('radio', { name: /Faísca/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Apostar' }));
    expect(onBet).toHaveBeenCalledWith(0, 6, 3);
  });
});
