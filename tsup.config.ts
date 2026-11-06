import { defineConfig } from 'tsup';

// Claude Code clones the repository and builds nothing, so `dist/` is committed: two self-contained ESM files,
// `hook.mjs` and `worker.mjs`, the SDK and OpenTelemetry inside the worker. Unsplit, since splitting writes a file
// for every dynamic import it meets, imported by nothing.
export default defineConfig({
  entry: { hook: 'src/bin/hook.ts', worker: 'src/bin/worker.ts' },
  format: ['esm'],
  outExtension: () => ({ js: '.mjs' }),
  platform: 'node',
  target: 'node22',
  splitting: false,
  noExternal: [/.*/],
  // Readable stack traces in a bug report.
  minify: false,
  sourcemap: false,
  clean: true,
});
