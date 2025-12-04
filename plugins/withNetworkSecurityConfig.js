const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Allow cleartext (HTTP) traffic for all domains -->
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
</network-security-config>`;

/**
 * Expo config plugin to add network security config for cleartext HTTP traffic
 */
module.exports = function withNetworkSecurityConfig(config) {
  // Add network security config file
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const xmlDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'xml');
      const filePath = path.join(xmlDir, 'network_security_config.xml');

      // Create directory if it doesn't exist
      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }

      // Write the network security config file
      fs.writeFileSync(filePath, networkSecurityConfig);

      return config;
    },
  ]);

  // Add reference to AndroidManifest
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    // Add network security config to application tag
    if (androidManifest.application && androidManifest.application.length > 0) {
      androidManifest.application[0].$['android:networkSecurityConfig'] =
        '@xml/network_security_config';
    }

    return config;
  });

  return config;
};
