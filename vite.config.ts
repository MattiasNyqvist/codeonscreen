import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

export default defineConfig({
  plugins: [react()],
  // Relative asset paths: the same build works at a domain root (VPS, custom
  // domain) and in a sub-folder (user.github.io/code-on-screen/).
  base: './',
  // Baked into the bundle, so the page itself tells you which build you are looking at.
  // See src/app.ts; the types are declared in src/vite-env.d.ts.
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    // Monaco is large by nature (~3 MB); the default 500 kB warning is noise here.
    chunkSizeWarningLimit: 4000,
  },
});
