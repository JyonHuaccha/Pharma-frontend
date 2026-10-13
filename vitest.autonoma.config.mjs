import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    pool: 'threads', maxWorkers: 1,
    reporters: ['default', 'json'],
    outputFile: { json: 'docs/autonoma-s9/resultados-angular.json' },
  },
});
