import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Extratos bancários (principalmente PDF) podem passar de 1MB.
      bodySizeLimit: "15mb",
      // Permite rodar via túneis de preview (Codespaces, Gitpod) além do host local.
      allowedOrigins: ["*.app.github.dev", "*.gitpod.io", "localhost:3000"],
    },
  },
};

export default nextConfig;
