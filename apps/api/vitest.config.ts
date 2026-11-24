import { configDefaults, defineConfig } from 'vitest/config';

// `pnpm test` roda só os unitários (sem banco); os `*.int.test.ts` ficam para `pnpm test:int`.
export default defineConfig({
  test: { exclude: [...configDefaults.exclude, '**/*.int.test.ts'] },
});
