// Builds the small page that stays on the old GitHub Pages address (see handover.ts).
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: here,
  base: './',
  envDir: path.resolve(here, '../..'),
  build: { outDir: path.resolve(here, '../../redirect'), emptyOutDir: true },
  server: { port: 3002 },
});
