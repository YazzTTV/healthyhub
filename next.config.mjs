/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  /** Réduit les watchers fichiers (souvent utile sur macOS / EMFILE). */
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1500,
        aggregateTimeout: 600,
      };
    }
    return config;
  },
};

export default nextConfig;
