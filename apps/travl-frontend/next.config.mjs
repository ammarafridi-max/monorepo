/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@travel-suite/frontend-shared'],
};

export default nextConfig;
