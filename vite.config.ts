import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  server: {
    port: 3000
  },
  build: {
    target: 'es2020'
  }
})