const CompressionPlugin = require('compression-webpack-plugin');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Fix workspace root warning
  outputFileTracingRoot: __dirname,

  // Optimize builds
  experimental: {
    optimizeCss: true,
    // ENHANCED: Added more packages for tree-shaking
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'react-markdown',
      '@radix-ui/react-tabs',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-avatar',
      '@radix-ui/react-select',
      '@langchain/core',
      '@langchain/google-genai',
      'pocketbase',
    ],
  },

  // Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Production optimizations
  compress: true,
  poweredByHeader: false,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // ENHANCED: Webpack optimizations for dev and production
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Optimize dev builds
      config.watchOptions = {
        poll: false,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.next', '**/.git'],
      };

      config.resolve.symlinks = false;

      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };

      // Better caching for dev
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }

    // OPTIMIZATION: Production build enhancements
    if (!dev && !isServer) {
      // Add Brotli and Gzip compression
      config.plugins.push(
        new CompressionPlugin({
          filename: '[path][base].br',
          algorithm: 'brotliCompress',
          test: /\.(js|css|html|svg)$/,
          compressionOptions: {
            level: 11,
          },
          threshold: 8192,
          minRatio: 0.8,
          deleteOriginalAssets: false,
        }),
        new CompressionPlugin({
          filename: '[path][base].gz',
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 8192,
          minRatio: 0.8,
          deleteOriginalAssets: false,
        })
      );

      // Enhanced code splitting
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name(module) {
                const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
                return `vendor.${packageName.replace('@', '')}`;
              },
              priority: 10,
            },
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },

  // Headers configuration - allow PocketBase and deployment server connections
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "connect-src 'self' https: http://localhost:4000 http://localhost:8090 http://127.0.0.1:8090 ws://localhost:* wss://localhost:*;",
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
