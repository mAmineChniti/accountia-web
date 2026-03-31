import type { NextConfig } from 'next';
import './env.js';

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {},
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    return config;
  },
};

export default nextConfig;
