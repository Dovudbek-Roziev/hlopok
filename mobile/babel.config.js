module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated — eng oxirida bo'lishi shart / Must be last
      'react-native-reanimated/plugin',
    ],
  };
};
