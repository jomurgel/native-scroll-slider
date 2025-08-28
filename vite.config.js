import { defineConfig } from 'vite';

export default defineConfig(({ command, mode }) => {
  // Check if we're building for GitHub Pages demo.
  const isDemo = mode === 'demo';

  if (isDemo) {
    // Configuration for GitHub Pages demo.
    return {
      root: '.',
      base: './',
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
          input: './index.html'
        }
      }
    };
  }

  // Default configuration for library builds.
  return {
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
          {
            format: 'es',
            entryFileNames: 'index.esm.js'
          },
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