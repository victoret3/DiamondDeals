/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@diamont-deals/database", "@diamont-deals/ui", "@diamont-deals/utils"],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
