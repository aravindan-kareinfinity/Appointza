const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'css', 'json'],
    assetExts: ['css', 'png', 'jpg', 'jpeg', 'gif', 'webp']
  }
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
