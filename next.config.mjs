/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/salon',
        destination: '/village',
        permanent: true,
      },
      {
        source: '/salon/:path*',
        destination: '/village/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
