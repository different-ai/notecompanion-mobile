// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");
const { FileStore } = require("metro-cache");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

module.exports = withTurborepoManagedCache(
  withMonorepoPaths(
    // eslint-disable-next-line no-undef
    withNativeWind(getDefaultConfig(__dirname), {
      input: "./globals.css",
      configPath: "./tailwind.config.ts",
    }),
  ),
);