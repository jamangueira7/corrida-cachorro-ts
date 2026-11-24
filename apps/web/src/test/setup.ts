import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Sem `globals`, o Testing Library não registra a limpeza sozinho.
afterEach(() => cleanup());

// O Testing Library só reconhece timers falsos se existir um `jest` global; sem isto, `userEvent` trava com `vi.useFakeTimers()`.
Object.assign(globalThis, { jest: { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) } });
