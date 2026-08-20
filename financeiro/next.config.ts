import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Extratos bancários (principalmente PDF) podem passar de 1MB.
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
