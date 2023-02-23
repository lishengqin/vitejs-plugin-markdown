import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
/* @ts-ignore */
import markdown from './markdownPlugin/index';
export default defineConfig({
  plugins: [vue(), { ...markdown() }],
  server: {
    //host: "0.0.0.0"
  }
})
