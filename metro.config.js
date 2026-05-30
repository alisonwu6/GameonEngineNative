const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  'react-native-safe-area-context': path.resolve(__dirname, 'safe-area-polyfill.js'),
};

module.exports = config;
