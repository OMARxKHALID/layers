/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "@ffmpeg-installer/ffmpeg",
    "@ffprobe-installer/ffprobe",
    "fluent-ffmpeg",
    "sharp",
  ],
  // Increase timeout for serverless functions (e.g. Vercel) to 5 minutes
  experimental: {
    serverActions: {
      bodySizeLimit: "2gb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
