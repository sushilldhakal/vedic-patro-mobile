import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/lib/theme-context";
import { useLocale } from "@/lib/i18n";
import type { AppLanguage } from "@/lib/language-storage";
import { useOfflineData } from "@/lib/offline/OfflineDataContext";
import {
  setOnboardingComplete,
  setStoredCalendarEraPreference,
  setStoredDataMode,
  type OnboardingCalendarEra,
  type OnboardingDataMode,
} from "@/lib/onboarding-storage";
import { setCachedCalendarEraPreference } from "@/lib/patro-era-preference";

function OptionCard({
  selected,
  onPress,
  title,
  subtitle,
  icon,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center gap-2 rounded-xl border-2 px-3 py-4 active:opacity-80"
      style={{
        borderColor: selected ? colors.secondary : colors.border,
        backgroundColor: selected ? `${colors.secondary}1a` : colors.card,
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Ionicons name={icon} size={22} color={selected ? colors.secondary : colors.mutedForeground} />
      <Text
        className="text-center text-sm font-semibold"
        style={{ color: selected ? colors.secondary : colors.foreground }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text className="text-center text-xs text-muted-foreground">{subtitle}</Text>
      ) : null}
    </Pressable>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mt-7 gap-3">
      <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Text>
      <View className="flex-row gap-3">{children}</View>
    </View>
  );
}

/**
 * The very first screen a new install sees, before anything else in the app
 * renders (see app/_layout.tsx). Downloading calendar data offline is the
 * user's call, not something the app decides on its own — this is the one
 * place that asks, up front, alongside the other day-one preferences.
 */
export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { setPreference, colors } = useTheme();
  const { setLang } = useLocale();
  const { isOnline, startInstallDownload } = useOfflineData();

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [language, setLanguage] = useState<AppLanguage>("ne");
  const [era, setEra] = useState<OnboardingCalendarEra>("bs");
  const [dataMode, setDataMode] = useState<OnboardingDataMode>("online");
  const [submitting, setSubmitting] = useState(false);

  const chooseTheme = (next: "light" | "dark") => {
    setTheme(next);
    setPreference(next);
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      setLang(language);
      setCachedCalendarEraPreference(era);
      await Promise.all([setStoredCalendarEraPreference(era), setStoredDataMode(dataMode)]);
      await setOnboardingComplete();
      if (dataMode === "offline") void startInstallDownload();
      onComplete();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 24, paddingTop: 64, paddingBottom: 40 }}
    >
      <Text className="text-2xl font-bold text-foreground">वैदिक पात्रोमा स्वागत छ</Text>
      <Text className="mt-1 text-base text-foreground">Welcome to Vedic Patro</Text>
      <Text className="mt-2 text-sm text-muted-foreground">
        सुरु गर्नु अघि केही रोजाइहरू मिलाऔं। पछि सेटिङबाट यी सबै परिवर्तन गर्न सकिन्छ।
      </Text>
      <Text className="mt-1 text-sm text-muted-foreground">
        Let's set a few preferences before you start — you can change all of these later in
        Settings.
      </Text>

      <Section label="थिम · Theme">
        <OptionCard
          icon="sunny-outline"
          title="उज्यालो · Light"
          selected={theme === "light"}
          onPress={() => chooseTheme("light")}
        />
        <OptionCard
          icon="moon-outline"
          title="अँध्यारो · Dark"
          selected={theme === "dark"}
          onPress={() => chooseTheme("dark")}
        />
      </Section>

      <Section label="भाषा · Language">
        <OptionCard
          icon="language-outline"
          title="नेपाली"
          selected={language === "ne"}
          onPress={() => setLanguage("ne")}
        />
        <OptionCard
          icon="language-outline"
          title="English"
          selected={language === "en"}
          onPress={() => setLanguage("en")}
        />
      </Section>

      <Section label="पात्रो · Calendar">
        <OptionCard
          icon="calendar-outline"
          title="वि.सं. · BS"
          subtitle="Bikram Sambat"
          selected={era === "bs"}
          onPress={() => setEra("bs")}
        />
        <OptionCard
          icon="calendar-outline"
          title="ई.सं. · AD"
          subtitle="Gregorian"
          selected={era === "ad"}
          onPress={() => setEra("ad")}
        />
      </Section>

      <Section label="डाटा · Data">
        <OptionCard
          icon="download-outline"
          title="अफलाइन · Offline"
          subtitle="डाउनलोड गर्नुहोस् · Download data"
          selected={dataMode === "offline"}
          onPress={() => setDataMode("offline")}
        />
        <OptionCard
          icon="cloud-outline"
          title="अनलाइन · Online"
          subtitle="डाउनलोड नगर्नुहोस् · Don't download"
          selected={dataMode === "online"}
          onPress={() => setDataMode("online")}
        />
      </Section>

      {dataMode === "offline" ? (
        <Text className="mt-3 text-xs text-muted-foreground">
          {isOnline
            ? "करिब ८० वर्षको पात्रो अफलाइन प्रयोगको लागि डाउनलोड हुनेछ (करिब १००–१५० MB)। · About 80 years of calendar data will download for offline use (roughly 100–150MB)."
            : "इन्टरनेट जोडिएपछि डाउनलोड सुरु हुनेछ। · Download will start once you're connected to the internet."}
        </Text>
      ) : (
        <Text className="mt-3 text-xs text-muted-foreground">
          पछि जुनसुकै बेला वर्ष छान्दा डाउनलोड गर्न सकिनेछ। · You can still download individual years
          later, whenever you browse to them.
        </Text>
      )}

      <Pressable
        onPress={submit}
        disabled={submitting}
        className="mt-8 flex-row items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3.5 active:opacity-80 disabled:opacity-60"
      >
        {submitting ? <ActivityIndicator size="small" color="#ffffff" /> : null}
        <Text className="text-base font-semibold" style={{ color: "#ffffff" }}>
          अगाडि बढ्नुहोस् · Get Started
        </Text>
      </Pressable>
    </ScrollView>
  );
}
