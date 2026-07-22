import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, View } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts, Mukta_400Regular, Mukta_500Medium, Mukta_600SemiBold, Mukta_700Bold } from "@expo-google-fonts/mukta";
import { FiraCode_400Regular, FiraCode_700Bold } from "@expo-google-fonts/fira-code";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LocaleProvider } from "@/lib/i18n";
import { ThemeProvider, useTheme } from "@/lib/theme-context";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { AppHeader } from "@/components/AppHeader";
import { FloatingNavBar } from "@/components/FloatingNavBar";
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LocaleProvider>
            {!loaded ? (
              <View className="flex-1 items-center justify-center bg-background">
                <VedicPatroLoader />
              </View>
            ) : (
              <QueryClientProvider client={queryClient}>
                <AuthProvider>
                  <View className="flex-1 bg-background">
                    <AppHeader />
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="(tabs)" />
                      <Stack.Screen
                        name="day/[ad]"
                        options={{ presentation: "modal", animation: "slide_from_bottom" }}
                      />
                    </Stack>
                    <FloatingNavBar />
                  </View>
                  <ThemedStatusBar />
                </AuthProvider>
              </QueryClientProvider>
            )}
          </LocaleProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
