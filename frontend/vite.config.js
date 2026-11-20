import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backend = env.DJANGO_DEV_URL || 'http://127.0.0.1:8000';
  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': { target: backend },
        '/accounts': { target: backend },
      },
    },
    // Django maps the contents of dist/ directly to the root of /static/.
    base: '/static/',
    // Folder Vite sends the compiled build to.
    build: {
      outDir: '../apps/vert_core/dist',
      emptyOutDir: true,
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      restoreMocks: true,
      include: ['src/test/**/*.test.{js,jsx}'],
    },
  };
});
