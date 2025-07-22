const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");
const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  packagerConfig: {
    asar: true,
    icon: "./icons/icon", // Base name, platform extensions added automatically
    // Explicitly disable signing for local development
    osxSign: false,
    osxNotarize: false,
    // Enable signing only in CI with ALL required credentials
    ...(process.env.CI && 
        process.env.APPLE_SIGN_IDENTITY && 
        process.env.APPLE_CERTIFICATE && 
        process.env.APPLE_ID ? {
      osxSign: {
        identity: process.env.APPLE_SIGN_IDENTITY,
        'hardened-runtime': true,
        'gatekeeper-assess': false,
      },
      osxNotarize: {
        appleId: process.env.APPLE_ID,
        appleIdPassword: process.env.APPLE_PASSWORD,
        teamId: process.env.APPLE_TEAM_ID,
      },
    } : {}),
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        iconUrl: "https://www.robolike.com/favicon.ico",
        setupIcon: "./icons/icon.ico",
      },
    },
    {
      name: "@electron-forge/maker-dmg",
      platforms: ["darwin"],
      config: {
        icon: "./icons/icon.icns",
      },
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        icon: "./icons/icon.png",
      },
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  build: {
    protocols: [
      {
        name: "Robolike",
        schemes: ["robolike"],
      },
    ],
    mac: {
      category: "public.app-category.utilities",
    },
    linux: {
      mimeTypes: ["x-scheme-handler/robolike"],
    },
  },
};
