import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `vite build --mode artifact` gera um bundle único (sem chunks) para virar um HTML autocontido.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: './',
  define: mode === 'artifact' ? { 'import.meta.env.VITE_ROUTER': JSON.stringify('memory') } : {},
  build:
    mode === 'artifact'
      ? { outDir: 'dist-artifact', rollupOptions: { output: { inlineDynamicImports: true } } }
      : {},
}));
