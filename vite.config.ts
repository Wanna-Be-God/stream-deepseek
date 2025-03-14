import { defineConfig } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import WindiCSS from 'vite-plugin-windicss';
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(),
    WindiCSS()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
