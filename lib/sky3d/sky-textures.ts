/**
 * Texture sources for the 3D sky.
 *
 * On native, `@react-three/fiber/native` patches `THREE.TextureLoader` to accept
 * a bundler module ref directly, so the `require` is handed straight through.
 * On web there is no such patch and a plain URL is what the DOM image loader
 * wants, so the module is resolved through expo-asset first.
 */

import { Platform } from "react-native";
import { Asset } from "expo-asset";

const MODULES = {
  sun: require("@/assets/sky3d/sun.jpg"),
  moon: require("@/assets/sky3d/moon.jpg"),
  mercury: require("@/assets/sky3d/mercury.jpg"),
  venus: require("@/assets/sky3d/venus.jpg"),
  earth: require("@/assets/sky3d/earth.jpg"),
  earthclouds: require("@/assets/sky3d/earthclouds.jpg"),
  mars: require("@/assets/sky3d/mars.jpg"),
  jupiter: require("@/assets/sky3d/jupiter.jpg"),
  saturn: require("@/assets/sky3d/saturn.jpg"),
  saturnring: require("@/assets/sky3d/saturnring.jpg"),
  background: require("@/assets/sky3d/background.jpg"),
} as const;

export type SkyTextureKey = keyof typeof MODULES;

/** Stable key order — `useLoader` needs the same array shape on every render. */
export const SKY_TEXTURE_KEYS = Object.keys(MODULES) as SkyTextureKey[];

/** What to hand `THREE.TextureLoader` for each texture, per platform. */
export const SKY_TEXTURE_SOURCES: unknown[] = SKY_TEXTURE_KEYS.map((key) =>
  Platform.OS === "web" ? Asset.fromModule(MODULES[key]).uri : MODULES[key],
);
