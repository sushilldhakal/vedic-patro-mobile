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
  const { colors } = useTheme();

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      {loaded ? <ThemedStatusBar /> : null}
      {!loaded ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, styles.fontGate, { backgroundColor: colors.background }]}
        >
          <VedicPatroLoader />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  fontGate: {
    alignItems: "center",
    justifyContent: "center",
  },
});
