import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, View } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts, Mukta_400Regular, Mukta_500Medium, Mukta_600SemiBold, Mukta_700Bold } from "@expo-google-fonts/mukta";
import { FiraCode_400Regular, FiraCode_700Bold } from "@expo-google-fonts/fira-code";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LocaleProvider } from "@/lib/i18n";
import { ThemeProvider, useTheme } from "@/lib/theme-context";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { VedicPatroLoader } from "@/components/branding/VedicPatroLoader";
import { cn } from "@/lib/utils";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 2,
    },
  },
});

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Mukta_400Regular,
    Mukta_500Medium,
    Mukta_600SemiBold,
    Mukta_700Bold,
    FiraCode_400Regular,
    FiraCode_700Bold,
  });

  useEffect(() => {
    if (!loaded) return;
    if (Platform.OS === "web") {
      window.__hideVedicPatroBootSplash?.();
    }
    void SplashScreen.hideAsync();
  }, [loaded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }} className="flex-1">
      <ThemeProvider>
        <LocaleProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <RootShell loaded={loaded} />
            </AuthProvider>
          </QueryClientProvider>
        </LocaleProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function RootShell({ loaded }: { loaded: boolean }) {
  const { resolvedTheme } = useTheme();

  return (
    <View
      className={cn("flex-1 bg-background", resolvedTheme === "dark" && "dark")}
      style={{ flex: 1 }}
    >
      <Stack screenOptions={{ headerShown: false }} />
      {loaded ? <ThemedStatusBar /> : null}
      {!loaded ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, styles.fontGate]}
          className="bg-background"
        >
          <VedicPatroLoader />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fontGate: {
    alignItems: "center",
    justifyContent: "center",
  },
});
