import type { NextConfig } from 'next';
import './env.js';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
};

export default nextConfig;
