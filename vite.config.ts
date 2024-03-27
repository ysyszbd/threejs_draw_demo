/*
 * @LastEditTime: 2024-03-27 14:52:08
 * @Description:
 */
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import postcssPx2Rem from "postcss-pxtorem";
import autoprefixer from "autoprefixer";

export default defineConfig({
  base: "/",
  plugins: [vue()],
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
    postcss: {
      plugins: [
        autoprefixer(),
        postcssPx2Rem({
          exclude: /node_modules/,
          mediaQuery: false,
          unitPrecision: 3,
          minPixelValue: 0,
          propList: ["*"],
        }),
      ],
    },
  },
});
