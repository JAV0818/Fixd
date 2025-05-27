const { getDefaultConfig } = require('@expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Force Metro to always resolve the root copy of AsyncStorage so only one version is bundled
config.resolver.extraNodeModules = {
  '@react-native-async-storage/async-storage': require.resolve(
    '@react-native-async-storage/async-storage'
  ),
};

// Always import the ESM version of all `@firebase/*` packages
config.resolver.resolveRequest = (context, moduleImport, platform) => {
  if (moduleImport.startsWith('@firebase/')) {
    return context.resolveRequest(
      {
        ...context,
        isESMImport: true, // Mark the import method as ESM
      },
      moduleImport,
      platform
    );
  }

  return context.resolveRequest(context, moduleImport, platform);
};

module.exports = config; 