const { composePlugins, withNx } = require('@nx/webpack');

module.exports = composePlugins(withNx(), (config, { configuration }) => {
  // Only minify for production builds
  if (configuration === 'production') {
    config.optimization = config.optimization || {};
    config.optimization.minimize = true;
  }

  // Externalize pino transports — they use worker threads
  // and cannot be bundled by webpack
  config.externals = config.externals || [];
  if (Array.isArray(config.externals)) {
    config.externals.push('pino-pretty');
  }

  return config;
});
