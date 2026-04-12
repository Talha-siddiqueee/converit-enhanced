import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import type { Plugin } from 'vite'

// Custom plugin to always inject COOP/COEP headers (required for SharedArrayBuffer / FFmpeg WASM)
function coopCoepPlugin(): Plugin {
  return {
    name: 'coop-coep-headers',
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
        next()
      })
    },
  }
}

const config = defineConfig({
  plugins: [
    coopCoepPlugin(),  // MUST be first to run before other middlewares
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({
      spa: {
        enabled: true,
        prerender: {
          outputPath: 'index.html',
        }
      }
    }),
    viteReact(),
  ],
  resolve: {
    alias: {
      mammoth: 'mammoth/mammoth.browser',
    },
  },
  optimizeDeps: {
    include: ['pdf-lib', 'papaparse', 'marked', 'turndown', 'xlsx', 'lamejs'],
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
})

export default config
