const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('mjs');

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  buffer: require.resolve('buffer'),
  tamagui: path.resolve(__dirname, 'app/compat/tamagui-shim.tsx'),
};

module.exports = config;
