import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - generates stats.html after build
    visualizer({
      open: true, // Auto-open in browser after build
      filename: 'dist/stats.html', // Output file
      gzipSize: true, // Show gzipped sizes
      brotliSize: true, // Show brotli sizes
      template: 'treemap', // 'treemap', 'sunburst', 'network'
      sourcemap: true, // Analyze sourcemaps
    }),
  ],
  build: {
    sourcemap: true, // Enable source maps for analysis
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor splitting for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react'],
          // Chart library splitting (large dependency)
          'chart-vendor': ['recharts'],
        },
      },
    },
  },
  server: {
    port: 5050,
    host: true
  }
})
