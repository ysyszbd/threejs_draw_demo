/*
 * @LastEditTime: 2024-03-03 22:25:47
 * @Description: 
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from "path"
import commonjs from '@rollup/plugin-commonjs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), commonjs()],
  resolve: {
    alias: {
      '@': resolve(__dirname, "src")
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import "./src/style/index.scss";
        `,
        charset: false,
        javascriptEnabled: true,
      }
    }
  }
})
