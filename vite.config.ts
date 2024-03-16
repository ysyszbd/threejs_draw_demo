/*
 * @LastEditTime: 2024-03-04 09:59:29
 * @Description: 
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from "path"
import postcssPx2Rem from 'postcss-pxtorem'
import autoprefixer from 'autoprefixer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()
  ],
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
    },
    postcss: {
      plugins: [
        autoprefixer(),
        postcssPx2Rem({
          exclude: /node_modules/,
          mediaQuery: false,
          unitPrecision: 3,
          minPixelValue: 0,
          propList: ['*'],
        })
      ]
    },
  }
})
