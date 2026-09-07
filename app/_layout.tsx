import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, View } from "react-native";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_500Medium,
  NotoSansDevanagari_600SemiBold,
  NotoSansDevanagari_700Bold,
} from "@expo-google-fonts/noto-sans-devanagari";
import { FiraCode_400Regular, FiraCode_700Bold } from "@expo-google-fonts/fira-code";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LocaleProvider } from "@/lib/i18n";
import { ThemeProvider, useTheme } from "@/lib/theme-context";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { OfflineDataProvider } from "@/lib/offline/OfflineDataContext";
import { VedicPatroLoader } from "@/components/branding/VedicPatroLoader";
import { usePatroCapabilities } from "@/lib/use-patro-capabilities";

SplashScreen.preventAutoHideAsync().catch(() => {
  /* Expo Go / hot reload may not register a native splash view controller. */
});

// Kept well past staleTime so a query survives long enough to be persisted
// and read back offline after the app is closed and reopened.
const QUERY_GC_TIME = 1000 * 60 * 60 * 24 * 7;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: QUERY_GC_TIME,
      retry: 2,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "vedic-patro-query-cache",
});

// The bulk BS-year/month calendar payloads have their own dedicated, much more
// storage-efficient offline store (lib/offline/offline-store.ts, backed by
// SQLite) — keep them out of this general-purpose persister so it stays small
// and fast for everything else the user has recently viewed (a day's
// panchanga, gochar, rashifal, festivals, holidays…).
function shouldPersistQuery(query: { queryKey: readonly unknown[] }): boolean {
  const [scope, sub] = query.queryKey;
  if (scope === "month") return false;
  if (scope === "panchanga" && sub === "year-wheel") return false;
  return true;
}

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    NotoSansDevanagari_400Regular,
    NotoSansDevanagari_500Medium,
    NotoSansDevanagari_600SemiBold,
    NotoSansDevanagari_700Bold,
    FiraCode_400Regular,
    FiraCode_700Bold,
    ...Ionicons.font,
  });

  useEffect(() => {
    if (!loaded) return;
    if (Platform.OS === "web") {
      window.__hideVedicPatroBootSplash?.();
    }
    void SplashScreen.hideAsync().catch(() => {
      /* Already hidden or unavailable (common in Expo Go). */
    });
  }, [loaded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }} className="flex-1 bg-background">
      <SafeAreaProvider>
        <ThemeProvider>
          <LocaleProvider>
            <PersistQueryClientProvider
              client={queryClient}
              persistOptions={{
                persister: asyncStoragePersister,
                maxAge: QUERY_GC_TIME,
                dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
              }}
            >
              <OfflineDataProvider>
                <AuthProvider>
                  <RootShell loaded={loaded} />
                </AuthProvider>
              </OfflineDataProvider>
            </PersistQueryClientProvider>
          </LocaleProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootShell({ loaded }: { loaded: boolean }) {
  const { colors } = useTheme();
  usePatroCapabilities();

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
          style={[StyleSheet.absoluteFill, styles.fontGate, { backgroundColor: colors.background }]}
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
