import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, View } from "react-native";
import { Text } from "@/components/ui/Text";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as Facebook from "expo-auth-session/providers/facebook";
import { useLocale } from "@/lib/i18n";
import { useThemeColors } from "@/lib/theme-context";
import {
  getGoogleClientIds,
  googleSignInSetupMessage,
  isGoogleSignInConfiguredForPlatform,
} from "@/lib/auth/google-oauth";
import {
  facebookAppId,
  facebookSignInEnabled,
  googleSignInEnabled,
} from "@/lib/auth/oauth-config";

WebBrowser.maybeCompleteAuthSession();

type Props = {
  onGoogle: (idToken: string) => void;
  onFacebook: (accessToken: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
};

export function SocialSignInButtons({ onGoogle, onFacebook, onError, disabled }: Props) {
  const colors = useThemeColors();
  const { pick } = useLocale();
  const [busy, setBusy] = useState<"google" | "facebook" | null>(null);

  const googleClientIds = getGoogleClientIds();
  const googleConfigured = isGoogleSignInConfiguredForPlatform();

  const [googleRequest, googleResponse, googlePrompt] = Google.useIdTokenAuthRequest({
    ...googleClientIds,
  });

  const [fbRequest, fbResponse, fbPrompt] = Facebook.useAuthRequest({
    clientId: facebookAppId ?? "",
    scopes: ["public_profile", "email"],
  });

  useEffect(() => {
    if (!__DEV__ || !googleSignInEnabled) return;
    console.info("[Google OAuth] redirect URI:", googleClientIds.redirectUri);
    console.info("[Google OAuth] platform:", Platform.OS);
  }, [googleClientIds.redirectUri]);

  useEffect(() => {
    if (!googleResponse) return;
    if (googleResponse.type === "success") {
      const idToken =
        googleResponse.params?.id_token ?? googleResponse.authentication?.idToken;
      if (idToken) onGoogle(idToken);
      else onError?.(pick("गुगल लग-इन असफल", "Google sign-in failed"));
    } else if (googleResponse.type === "error") {
      const err = googleResponse.error?.message ?? "";
      if (/redirect_uri_mismatch/i.test(err)) {
        onError?.(googleSignInSetupMessage());
      } else {
        onError?.(pick("गुगल लग-इन असफल", "Google sign-in failed"));
      }
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

  const showGoogle = googleSignInEnabled && googleConfigured;
  const showGoogleSetupHint = googleSignInEnabled && !googleConfigured;

  if (!showGoogle && !showGoogleSetupHint && !facebookSignInEnabled) return null;

  return (
    <View className="gap-3">
      {showGoogleSetupHint ? (
        <Text className="text-xs leading-relaxed text-muted-foreground">
          {googleSignInSetupMessage()}
        </Text>
      ) : null}

      {showGoogle ? (
        <Pressable
          disabled={disabled || !googleRequest || busy !== null}
          onPress={() => {
            setBusy("google");
            googlePrompt().catch(() => {
              onError?.(googleSignInSetupMessage());
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

      {showGoogle || facebookSignInEnabled ? (
        <View className="flex-row items-center gap-3 py-0.5">
          <View className="h-px flex-1" style={{ backgroundColor: colors.border }} />
          <Text className="text-xs text-muted-foreground">{pick("वा", "or")}</Text>
          <View className="h-px flex-1" style={{ backgroundColor: colors.border }} />
        </View>
      ) : null}
    </View>
  );
}
