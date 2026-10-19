import { defineConfig } from "vite";
import { resolve } from "path";

// Application multi-pages : le menu (fatality.html) et le jeu (index.html).
export default defineConfig({
  base: "./", // chemins relatifs : le build peut être déployé dans un sous-dossier
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        fatality: resolve(__dirname, "fatality.html")
      }
    }
  }
});