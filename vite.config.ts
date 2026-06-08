import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Redireciona a entrada do servidor TanStack Start para src/server.ts.
// @cloudflare/vite-plugin usa esta entrada; o main do wrangler.jsonc sozinho nao basta.
export default defineConfig({
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  server: {
    host: "127.0.0.1",
    port: 9010,
    strictPort: true,
    allowedHosts: ["unasp.vintenove.com"],
    watch: {
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100,
      },
    },
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" },
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
    }),
    viteReact(),
  ],
});
