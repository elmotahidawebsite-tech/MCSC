import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";


export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),

    VitePWA({
      registerType: "autoUpdate",

      devOptions: {
        enabled: true,
      },

      manifest: {
        name: "CSC - Crime Scene Collector",
        short_name: "CSC",
        description: "Crime Scene Collector",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",

        icons: [
          {
            src: "/192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
    }),
  ],

  server: {
    port: 5173,
  },
});