import { defineConfig } from 'vitest/config';

// Integração contra o Postgres real (banco `lab_test`). Arquivos em série: eles compartilham as mesmas tabelas.
export default defineConfig({
  test: {
    include: ['src/**/*.int.test.ts'],
    globalSetup: ['./src/test/int-global-setup.ts'],
    fileParallelism: false,
    testTimeout: 15_000,
  },
});
