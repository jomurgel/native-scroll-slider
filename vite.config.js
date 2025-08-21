import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'NativeScrollSlider',
      formats: ['es', 'umd']
    },
    minify: true,
    sourcemap: true,
    rollupOptions: {
      output: [
        // ES Module build for imports
        {
          format: 'es',
          entryFileNames: 'index.esm.js'
        },
        // UMD build for CDN
        {
          format: 'umd',
          name: 'NativeScrollSlider',
          entryFileNames: 'native-scroll-slider.min.js'
        }
      ]
    }
  }
});