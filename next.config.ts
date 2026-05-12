import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "oaidalleapiprodscus.blob.core.windows.net" },
      { protocol: "https", hostname: "**.higgsfield.ai" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  // Allow fluent-ffmpeg on server
  serverExternalPackages: ["fluent-ffmpeg", "@ffmpeg-installer/ffmpeg", "sharp"],
};

export default nextConfig;
