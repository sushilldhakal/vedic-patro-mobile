import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

export const PRIVACY_POLICY_URL =
  extra.privacyPolicyUrl || "https://www.vedicpatro.com/privacy";
export const TERMS_OF_USE_URL = extra.termsOfUseUrl || "https://www.vedicpatro.com/terms";
export const SUPPORT_URL = extra.supportUrl || "https://www.vedicpatro.com";
export const SUPPORT_EMAIL = extra.supportEmail || "support@vedicpatro.com";
export const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
