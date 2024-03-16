/*
 * @LastEditTime: 2024-03-16 17:38:43
 * @Description:
 */
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { comlink } from "vite-plugin-comlink";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), comlink()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import "./src/style/index.scss";
        `,
        charset: false,
        javascriptEnabled: true,
      },
    },
  },
  worker: {
    plugins: () => [comlink()],
  },
});
