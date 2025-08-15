import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  serverActions: {
    bodySizeLimit: '4.5mb',
    // Increase timeout for slow AI operations
    serverActions: {
      bodySizeLimit: '4.5mb',
      // Increase timeout for slow AI operations
      // @ts-expect-error - `timeout` is not yet in the type definition
      timeout: 120000,
    },
  },
};

export default nextConfig;
