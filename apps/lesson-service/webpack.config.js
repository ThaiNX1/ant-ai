const { composePlugins, withNx } = require('@nx/webpack');

module.exports = composePlugins(withNx(), (config, { configuration }) => {
  // Only minify for production builds
  // withNx() sets mode='none', so we check the Nx configuration instead
  if (configuration === 'production') {
    config.optimization = config.optimization || {};
    config.optimization.minimize = true;
  }
  return config;
});
