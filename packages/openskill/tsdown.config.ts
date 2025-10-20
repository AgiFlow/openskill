import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts', 'src/proxy-server.ts'],
  format: ['esm', 'cjs'],
  clean: true,
  shims: true,
  dts: true,
  exports: true,
  // Bundle all dependencies into the dist build
  noExternal: [/.*/],
});
