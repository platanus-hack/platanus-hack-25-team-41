/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://backend-849537710972.us-central1.run.app/api/:path*',
      },
    ]
  },
};

export default nextConfig;
