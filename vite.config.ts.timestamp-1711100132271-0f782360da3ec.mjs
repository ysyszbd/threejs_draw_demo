// vite.config.ts
import { defineConfig } from "file:///D:/YH_work/threejs_draw_demo/node_modules/.pnpm/registry.npmmirror.com+vite@5.0.8_@types+node@20.11.28_sass@1.70.0/node_modules/vite/dist/node/index.js";
import vue from "file:///D:/YH_work/threejs_draw_demo/node_modules/.pnpm/registry.npmmirror.com+@vitejs+plugin-vue@4.5.2_vite@5.0.8_vue@3.3.11/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import { resolve } from "path";
import postcssPx2Rem from "file:///D:/YH_work/threejs_draw_demo/node_modules/.pnpm/postcss-pxtorem@6.1.0_postcss@8.4.35/node_modules/postcss-pxtorem/index.js";
import autoprefixer from "file:///D:/YH_work/threejs_draw_demo/node_modules/.pnpm/autoprefixer@10.4.18_postcss@8.4.35/node_modules/autoprefixer/lib/autoprefixer.js";
import { comlink } from "file:///D:/YH_work/threejs_draw_demo/node_modules/.pnpm/vite-plugin-comlink@4.0.2_comlink@4.4.1_vite@5.0.8/node_modules/vite-plugin-comlink/dist/index.mjs";
var __vite_injected_original_dirname = "D:\\YH_work\\threejs_draw_demo";
var vite_config_default = defineConfig({
  base: "./",
  plugins: [vue(), comlink()],
  resolve: {
    alias: {
      "@": resolve(__vite_injected_original_dirname, "src")
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import "./src/style/index.scss";
        `,
        charset: false,
        javascriptEnabled: true
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
          propList: ["*"]
        })
      ]
    }
  },
  worker: {
    plugins: () => [comlink()]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxZSF93b3JrXFxcXHRocmVlanNfZHJhd19kZW1vXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxZSF93b3JrXFxcXHRocmVlanNfZHJhd19kZW1vXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9ZSF93b3JrL3RocmVlanNfZHJhd19kZW1vL3ZpdGUuY29uZmlnLnRzXCI7LypcbiAqIEBMYXN0RWRpdFRpbWU6IDIwMjQtMDMtMTYgMTc6Mzg6NDNcbiAqIEBEZXNjcmlwdGlvbjpcbiAqL1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJ1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gXCJwYXRoXCJcbmltcG9ydCBwb3N0Y3NzUHgyUmVtIGZyb20gJ3Bvc3Rjc3MtcHh0b3JlbSdcbmltcG9ydCBhdXRvcHJlZml4ZXIgZnJvbSAnYXV0b3ByZWZpeGVyJ1xuaW1wb3J0IHsgY29tbGluayB9IGZyb20gXCJ2aXRlLXBsdWdpbi1jb21saW5rXCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBiYXNlOiAnLi8nLFxuICBwbHVnaW5zOiBbdnVlKCksIGNvbWxpbmsoKV0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHJlc29sdmUoX19kaXJuYW1lLCBcInNyY1wiKSxcbiAgICB9LFxuICB9LFxuICBjc3M6IHtcbiAgICBwcmVwcm9jZXNzb3JPcHRpb25zOiB7XG4gICAgICBzY3NzOiB7XG4gICAgICAgIGFkZGl0aW9uYWxEYXRhOiBgXG4gICAgICAgICAgQGltcG9ydCBcIi4vc3JjL3N0eWxlL2luZGV4LnNjc3NcIjtcbiAgICAgICAgYCxcbiAgICAgICAgY2hhcnNldDogZmFsc2UsXG4gICAgICAgIGphdmFzY3JpcHRFbmFibGVkOiB0cnVlLFxuICAgICAgfVxuICAgIH0sXG4gICAgcG9zdGNzczoge1xuICAgICAgcGx1Z2luczogW1xuICAgICAgICBhdXRvcHJlZml4ZXIoKSxcbiAgICAgICAgcG9zdGNzc1B4MlJlbSh7XG4gICAgICAgICAgZXhjbHVkZTogL25vZGVfbW9kdWxlcy8sXG4gICAgICAgICAgbWVkaWFRdWVyeTogZmFsc2UsXG4gICAgICAgICAgdW5pdFByZWNpc2lvbjogMyxcbiAgICAgICAgICBtaW5QaXhlbFZhbHVlOiAwLFxuICAgICAgICAgIHByb3BMaXN0OiBbJyonXSxcbiAgICAgICAgfSlcbiAgICAgIF1cbiAgICB9LFxuICB9LFxuICB3b3JrZXI6IHtcbiAgICBwbHVnaW5zOiAoKSA9PiBbY29tbGluaygpXSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUlBLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sU0FBUztBQUNoQixTQUFTLGVBQWU7QUFDeEIsT0FBTyxtQkFBbUI7QUFDMUIsT0FBTyxrQkFBa0I7QUFDekIsU0FBUyxlQUFlO0FBVHhCLElBQU0sbUNBQW1DO0FBWXpDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE1BQU07QUFBQSxFQUNOLFNBQVMsQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxRQUFRLGtDQUFXLEtBQUs7QUFBQSxJQUMvQjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLEtBQUs7QUFBQSxJQUNILHFCQUFxQjtBQUFBLE1BQ25CLE1BQU07QUFBQSxRQUNKLGdCQUFnQjtBQUFBO0FBQUE7QUFBQSxRQUdoQixTQUFTO0FBQUEsUUFDVCxtQkFBbUI7QUFBQSxNQUNyQjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLFNBQVM7QUFBQSxRQUNQLGFBQWE7QUFBQSxRQUNiLGNBQWM7QUFBQSxVQUNaLFNBQVM7QUFBQSxVQUNULFlBQVk7QUFBQSxVQUNaLGVBQWU7QUFBQSxVQUNmLGVBQWU7QUFBQSxVQUNmLFVBQVUsQ0FBQyxHQUFHO0FBQUEsUUFDaEIsQ0FBQztBQUFBLE1BQ0g7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sU0FBUyxNQUFNLENBQUMsUUFBUSxDQUFDO0FBQUEsRUFDM0I7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
