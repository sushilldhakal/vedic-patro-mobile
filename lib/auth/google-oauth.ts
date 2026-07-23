import * as Application from "expo-application";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { makeRedirectUri } from "expo-auth-session";
import { Platform } from "react-native";
import {
  googleAndroidClientId,
  googleIosClientId,
  googleWebClientId,
} from "@/lib/auth/oauth-config";

/** Redirect URI sent to Google — must be registered on the matching OAuth client. */
export function getGoogleRedirectUri(): string {
  return makeRedirectUri({
    scheme: "vedicpatro",
    path: "oauthredirect",
    native: `${Application.applicationId ?? "com.vedicpatro.mobile"}:/oauthredirect`,
  });
}

/** Pick the client ID Google expects for this platform. */
export function getGoogleClientIds() {
  return {
    clientId: googleWebClientId,
    iosClientId: googleIosClientId,
    androidClientId: googleAndroidClientId,
    redirectUri: getGoogleRedirectUri(),
  };
}

/** Google sign-in is only wired for web until native OAuth clients exist. */
export function isGoogleSignInConfiguredForPlatform(): boolean {
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  if (isExpoGo) {
    // Expo Go uses host.exp.Exponent — native OAuth clients for com.vedicpatro.mobile do not apply.
    return false;
  }
  if (Platform.OS === "web") {
    return Boolean(googleWebClientId);
  }
  if (Platform.OS === "ios") {
    return Boolean(googleIosClientId);
  }
  if (Platform.OS === "android") {
    return Boolean(googleAndroidClientId);
  }
  return false;
}

export function googleSignInSetupMessage(): string {
  const redirectUri = getGoogleRedirectUri();
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  if (isExpoGo) {
    return (
      "Google sign-in does not work in Expo Go (redirect_uri_mismatch). " +
      "Use a development build instead: npx expo run:ios or npx expo run:android, " +
      "then add iOS/Android OAuth clients in Google Cloud Console for com.vedicpatro.mobile."
    );
  }

  if (Platform.OS === "web") {
    return (
      `Google redirect URI mismatch. In Google Cloud Console → Credentials → your Web OAuth client, add:\n` +
      `Authorized redirect URI: ${redirectUri}\n` +
      `Authorized JavaScript origin: ${typeof window !== "undefined" ? window.location.origin : "http://localhost:8081"}`
    );
  }
  return (
    `Google sign-in on ${Platform.OS} needs a native OAuth client.\n` +
    `1. Google Cloud Console → Create OAuth client (${Platform.OS === "ios" ? "iOS, bundle com.vedicpatro.mobile" : "Android, package com.vedicpatro.mobile + SHA-1"})\n` +
    `2. Set google${Platform.OS === "ios" ? "Ios" : "Android"}ClientId in app.json extra\n` +
    `Redirect used by app: ${redirectUri}`
  );
}
