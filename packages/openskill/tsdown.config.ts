import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts', 'src/server.ts'],
  format: ['esm', 'cjs'],
  clean: true,
  shims: true,
  dts: true,
  exports: true,
});
