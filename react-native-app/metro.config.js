const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
});

// Enable support for various file extensions
config.resolver.sourceExts.push('cjs');

// Support for absolute imports with @/ prefix
config.resolver.alias = {
  '@': '.',
};

module.exports = config;