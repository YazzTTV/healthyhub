/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  /** Réduit les watchers fichiers (souvent utile sur macOS / EMFILE). */
  webpack: (config, { dev }) => {
    if (dev) {
      const prev = config.watchOptions ?? {};
      const extraIgnored = Array.isArray(prev.ignored)
        ? prev.ignored.filter((p) => typeof p === "string" && p.length > 0)
        : typeof prev.ignored === "string" && prev.ignored.length > 0
          ? [prev.ignored]
          : [];
      config.watchOptions = {
        ...prev,
        poll: 1500,
        aggregateTimeout: 600,
        ignored: ["**/node_modules/**", "**/.git/**", ...extraIgnored],
      };
    }
    return config;
  },
};

export default nextConfig;
