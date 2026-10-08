import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  turbopack: {
    resolveAlias: {
      '@clerk/nextjs/server': './src/lib/clerk-shims/server.js',
      '@clerk/nextjs': './src/lib/clerk-shims/client.js',
    },
  },
  webpack: (config) => {
    config.resolve.alias['@clerk/nextjs/server'] = path.resolve(__dirname, 'src/lib/clerk-shims/server.js');
    config.resolve.alias['@clerk/nextjs'] = path.resolve(__dirname, 'src/lib/clerk-shims/client.js');
    return config;
  }
};

export default nextConfig;
