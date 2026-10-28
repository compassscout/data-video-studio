import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages 部署在 /<repo>/ 子路径下，本地开发走根路径
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/data-video-studio/' : '/',
  plugins: [react()],
  build: {outDir: 'dist'},
});
