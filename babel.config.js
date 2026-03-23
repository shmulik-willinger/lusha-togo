module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // react-native-reanimated/plugin is intentionally omitted: nativewind/babel
    // already includes react-native-worklets/plugin (required by Reanimated 4.x),
    // so adding it again would run the worklets transform twice.
  };
};
