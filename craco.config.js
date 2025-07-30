module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      return {
        ...webpackConfig,
        optimization: {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
          },
        },
      };
    },
  },
};