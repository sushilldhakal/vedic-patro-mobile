import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as Facebook from "expo-auth-session/providers/facebook";
import { useLocale } from "@/lib/i18n";
import { useThemeColors } from "@/lib/theme-context";
import {
  facebookAppId,
  facebookSignInEnabled,
  googleAndroidClientId,
  googleIosClientId,
  googleSignInEnabled,
  googleWebClientId,
} from "@/lib/auth/oauth-config";

// Finishes the OAuth redirect when the app is reopened from the browser.
WebBrowser.maybeCompleteAuthSession();

type Props = {
  onGoogle: (idToken: string) => void;
  onFacebook: (accessToken: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
};

/**
 * Google + Facebook sign-in — the mobile equivalent of the web social buttons.
 * Uses expo-auth-session so it works on iOS, Android and web without a native
 * SDK, and hands the API the exact same tokens the web flow does
 * (Google ID token → /auth/google, Facebook access token → /auth/facebook).
 */
export function SocialSignInButtons({ onGoogle, onFacebook, onError, disabled }: Props) {
  const colors = useThemeColors();
  const { pick } = useLocale();
  const [busy, setBusy] = useState<"google" | "facebook" | null>(null);

  // Hooks must run unconditionally; an unset client id yields a null request,
  // which disables that button.
  const [googleRequest, googleResponse, googlePrompt] = Google.useIdTokenAuthRequest({
    clientId: googleWebClientId,
    iosClientId: googleIosClientId,
    androidClientId: googleAndroidClientId,
  });

  const [fbRequest, fbResponse, fbPrompt] = Facebook.useAuthRequest({
    clientId: facebookAppId ?? "",
    scopes: ["public_profile", "email"],
  });

  useEffect(() => {
    if (!googleResponse) return;
    if (googleResponse.type === "success") {
      const idToken =
        googleResponse.params?.id_token ?? googleResponse.authentication?.idToken;
      if (idToken) onGoogle(idToken);
      else onError?.(pick("गुगल लग-इन असफल", "Google sign-in failed"));
    } else if (googleResponse.type === "error") {
      onError?.(pick("गुगल लग-इन असफल", "Google sign-in failed"));
    }
    if (googleResponse.type !== "success") setBusy(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleResponse]);

  useEffect(() => {
    if (!fbResponse) return;
    if (fbResponse.type === "success") {
      const token =
        fbResponse.authentication?.accessToken ?? fbResponse.params?.access_token;
      if (token) onFacebook(token);
      else onError?.(pick("फेसबुक लग-इन असफल", "Facebook sign-in failed"));
    } else if (fbResponse.type === "error") {
      onError?.(pick("फेसबुक लग-इन असफल", "Facebook sign-in failed"));
    }
    if (fbResponse.type !== "success") setBusy(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fbResponse]);

  if (!googleSignInEnabled && !facebookSignInEnabled) return null;

  return (
    <View className="gap-3">
      {googleSignInEnabled ? (
        <Pressable
          disabled={disabled || !googleRequest || busy !== null}
          onPress={() => {
            setBusy("google");
            googlePrompt().catch(() => {
              onError?.(pick("गुगल लग-इन असफल", "Google sign-in failed"));
              setBusy(null);
            });
          }}
          className="h-12 flex-row items-center justify-center gap-2.5 rounded-full border border-border bg-card active:bg-muted"
          style={disabled || !googleRequest ? { opacity: 0.5 } : undefined}
        >
          {busy === "google" ? (
            <ActivityIndicator size="small" color={colors.foreground} />
          ) : (
            <Ionicons name="logo-google" size={18} color="#EA4335" />
          )}
          <Text className="text-base font-semibold text-foreground">
            {pick("गुगलबाट जारी राख्नुहोस्", "Continue with Google")}
          </Text>
        </Pressable>
      ) : null}

      {facebookSignInEnabled ? (
        <Pressable
          disabled={disabled || !fbRequest || busy !== null}
          onPress={() => {
            setBusy("facebook");
            fbPrompt().catch(() => {
              onError?.(pick("फेसबुक लग-इन असफल", "Facebook sign-in failed"));
              setBusy(null);
            });
          }}
          className="h-12 flex-row items-center justify-center gap-2.5 rounded-full border border-border bg-card active:bg-muted"
          style={disabled || !fbRequest ? { opacity: 0.5 } : undefined}
        >
          {busy === "facebook" ? (
            <ActivityIndicator size="small" color={colors.foreground} />
          ) : (
            <Ionicons name="logo-facebook" size={18} color="#1877F2" />
          )}
          <Text className="text-base font-semibold text-foreground">
            {pick("फेसबुकबाट जारी राख्नुहोस्", "Continue with Facebook")}
          </Text>
        </Pressable>
      ) : null}

      {/* divider */}
      <View className="flex-row items-center gap-3 py-0.5">
        <View className="h-px flex-1" style={{ backgroundColor: colors.border }} />
        <Text className="text-xs text-muted-foreground">{pick("वा", "or")}</Text>
        <View className="h-px flex-1" style={{ backgroundColor: colors.border }} />
      </View>
    </View>
  );
}
