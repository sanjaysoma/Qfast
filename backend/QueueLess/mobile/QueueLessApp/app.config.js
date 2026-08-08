const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const copyRecursive = (src, dest) => {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
};

const withCopyWebAssets = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const webSource = path.join(projectRoot, 'web');
      const assetsDest = path.join(config.modRequest.platformProjectRoot, 'src', 'main', 'assets', 'web');

      if (fs.existsSync(webSource)) {
        if (fs.existsSync(assetsDest)) {
          fs.rmSync(assetsDest, { recursive: true, force: true });
        }
        copyRecursive(webSource, assetsDest);
      }

      return config;
    },
  ]);
};

const withCleartextTraffic = (config) => {
  return withAndroidManifest(config, (config) => {
    if (
      config.modResults &&
      config.modResults.manifest &&
      config.modResults.manifest.application &&
      config.modResults.manifest.application[0]
    ) {
      const application = config.modResults.manifest.application[0];
      application.$ = application.$ || {};
      application.$['android:usesCleartextTraffic'] = 'true';
    }
    return config;
  });
};

const withDisabledExpoUpdates = (config) => {
  return withAndroidManifest(config, (config) => {
    if (
      config.modResults &&
      config.modResults.manifest &&
      config.modResults.manifest.application &&
      config.modResults.manifest.application[0]
    ) {
      const application = config.modResults.manifest.application[0];
      application['meta-data'] = (application['meta-data'] || []).filter((item) => {
        const name = item?.$?.['android:name'];
        return ![
          'expo.modules.updates.ENABLED',
          'expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH',
          'expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS',
        ].includes(name);
      });
    }

    return config;
  });
};

module.exports = ({ config }) => {
  const extra = {
    ...config.extra,
    ...(process.env.WEB_URL ? { WEB_URL: process.env.WEB_URL } : {}),
    ...(process.env.BACKEND_URL ? { BACKEND_URL: process.env.BACKEND_URL } : {}),
  };

  return {
    ...config,
    updates: {
      enabled: false,
      checkAutomatically: 'NEVER',
    },
    extra,
    plugins: [
      withCleartextTraffic,
      withDisabledExpoUpdates,
      withCopyWebAssets,
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: 'Allow QFast to access your location.',
        },
      ],
    ],
  };
};


