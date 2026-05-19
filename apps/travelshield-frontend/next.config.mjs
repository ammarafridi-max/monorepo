/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@travel-suite/frontend-shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
