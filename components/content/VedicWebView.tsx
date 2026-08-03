import { ActivityIndicator, Platform, View } from "react-native";
import { WebView } from "react-native-webview";
import { useThemeColors } from "@/lib/theme-context";

const WEB_BASE = "https://www.vedicpatro.com";

export function vedicPatroWebUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${WEB_BASE}${p}`;
}

/** In-app WebView for rich learn / ritual pages (diagrams, long-form content). */
export function VedicWebView({ path }: { path: string }) {
  const colors = useThemeColors();
  const uri = vedicPatroWebUrl(path);

  if (Platform.OS === "web") {
    return (
      <View className="min-h-[480px] overflow-hidden rounded-xl border border-border bg-card">
        {/* eslint-disable-next-line react/no-unknown-property */}
        <iframe
          title="Vedic Patro"
          src={uri}
          style={{ width: "100%", height: 560, border: "none", background: colors.background }}
        />
      </View>
    );
  }

  return (
    <View className="min-h-[420px] flex-1 overflow-hidden rounded-xl border border-border bg-card">
      <WebView
        source={{ uri }}
        startInLoadingState
        renderLoading={() => (
          <View className="absolute inset-0 items-center justify-center bg-background">
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
        style={{ flex: 1, backgroundColor: colors.background }}
        allowsInlineMediaPlayback
        setSupportMultipleWindows={false}
      />
    </View>
  );
}
