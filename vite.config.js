import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" sorgt dafür, dass die Seite sowohl unter
// https://<user>.github.io/<repo>/ als auch in der Android-App (file://) läuft.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: { outDir: "dist", assetsDir: "assets", sourcemap: false },
});
