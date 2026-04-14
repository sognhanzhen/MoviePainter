/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
