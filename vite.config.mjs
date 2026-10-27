import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'manifest.json', dest: '.' },
        { src: 'icons/icon.png', dest: 'icons', rename: { stripBase: 1 } },
        ...(mode === 'production' ? [
          { src: 'l10n/*.json', dest: 'l10n', rename: { stripBase: 1 } },
        ] : []),
      ],
    }),
  ],
  server: {
    strictPort: true,
  },
  base: './',
  build: {
    emptyOutDir: true,
    outDir: 'dist',
    target: 'chrome146',
  },
}))
