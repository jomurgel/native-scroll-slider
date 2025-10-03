import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Demo build for GitHub Pages
  if (mode === 'demo') {
    return {
      base: '/native-scroll-slider/',
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
          input: {
            main: resolve(__dirname, 'index.html'),
            demo: resolve(__dirname, './src/main.js')
          }
        }
      }
    };
  }

  // Library build for npm
  return {
    build: {
      outDir: 'dist',
      emptyOutDir: true,
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
  };
});
