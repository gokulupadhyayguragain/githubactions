/** @type {import('next').NextConfig} */
const withCloudflare = require('@cloudflare/next-on-pages');

const nextConfig = {
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = withCloudflare(nextConfig);