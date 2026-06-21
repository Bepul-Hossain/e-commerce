import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/super-admin",
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
  server: {
    port: 3001,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        // configure: (proxy) => {
        //   proxy.on("proxyReq", (proxyReq, req) => {
        //     console.log("Proxying:", req.url);
        //     console.log("Target Host:", proxyReq.getHeader("host"));
        //   });
        // },
      },
    },
  },
});
