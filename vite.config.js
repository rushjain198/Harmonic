import { defineConfig } from 'vite'

// Relative base so the build runs from any static host or file path.
export default defineConfig({
  base: './',
  // allowedHosts:true lets a tunnel (localtunnel/cloudflared/ngrok) reach the dev/preview
  // server without Vite's "host not allowed" block.
  server: { host: true, open: false, allowedHosts: true, watch: { ignored: ['**/.playwright-mcp/**'] } },
  preview: { host: true, allowedHosts: true },
  build: { target: 'esnext', sourcemap: false },
})
