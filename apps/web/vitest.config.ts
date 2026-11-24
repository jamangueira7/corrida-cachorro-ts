// Fica fora do tsconfig de propósito: o Vitest 2 embute o Vite 5 e os tipos do plugin React (Vite 6) não casam.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
