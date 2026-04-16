/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config) {
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"]
    };

    return config;
  },
  async redirects() {
    return [
      {
        source: "/healthz",
        destination: "/api/health",
        permanent: false
      }
    ];
  }
};

export default nextConfig;
