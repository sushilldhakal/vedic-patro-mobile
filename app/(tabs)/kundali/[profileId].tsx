import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AuthDialog } from "@/components/auth/AuthDialog";
import {
  KundaliProfilePicker,
  type KundaliProfilePickerHandle,
} from "@/components/kundali/KundaliProfilePicker";
import { KundaliLoginPrompt } from "@/components/kundali/KundaliLoginPrompt";
import { KundaliPageShell } from "@/components/kundali/KundaliPageShell";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLocale } from "@/lib/i18n";
import { profileChartParams } from "@/lib/kundali/profile-chart";
import { useProfilesQuery } from "@/lib/kundali/profiles-query";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { useThemeColors } from "@/lib/theme-context";

export default function KundaliDetailScreen() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  const { pick } = useLocale();
  const router = useRouter();
  const colors = useThemeColors();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const pickerRef = useRef<KundaliProfilePickerHandle>(null);
  const { data: profiles, isLoading } = useProfilesQuery(isAuthenticated);

  const profile = useMemo(
    () => profiles?.find((p) => p.id === profileId) ?? null,
    [profiles, profileId],
  );
  const chart = profile ? profileChartParams(profile) : null;

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <>
      <KundaliPageShell
        eyebrow={pick("ज्योतिष", "Jyotish")}
        title={profile?.full_name ?? pick("कुण्डली", "Kundali")}
        subtitle={
          profile
            ? pick("जन्मकुण्डली विवरण", "Birth chart details")
            : pick("प्रोफाइल लोड हुँदै…", "Loading profile…")
        }
        headerRight={
          <Pressable onPress={() => router.back()} className="rounded-lg p-2 active:bg-muted">
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </Pressable>
        }
      >
        {authLoading || (isAuthenticated && isLoading && !profile) ? (
          <View className="items-center rounded-xl border border-dashed border-border bg-muted/20 px-5 py-12">
            <ActivityIndicator />
          </View>
        ) : !isAuthenticated ? (
          <KundaliLoginPrompt
            titleNe="कुण्डली हेर्न लगइन"
            titleEn="Log in to view kundali"
            bodyNe="यो कुण्डली हेर्न साइन इन गर्नुहोस्।"
            bodyEn="Sign in to view this birth chart."
            onLogin={() => openAuth("login")}
            onSignup={() => openAuth("signup")}
          />
        ) : !profile ? (
          <Card>
            <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
              {pick("प्रोफाइल फेला परेन।", "Profile not found.")}
            </Text>
          </Card>
        ) : (
          <View className="gap-4">
            <Card className="gap-3">
              <MetaRow
                label={pick("जन्म मिति", "Birth date")}
                value={
                  profile.birth_date
                    ? `${profile.birth_date} ${(profile.birth_era ?? "bs").toUpperCase()}`
                    : "—"
                }
              />
              <MetaRow label={pick("जन्म समय", "Birth time")} value={profile.birth_time || "—"} />
              <MetaRow
                label={pick("जन्म स्थान", "Birth place")}
                value={profile.location_label || profile.city || "—"}
              />
              <MetaRow
                label={pick("समय क्षेत्र", "Timezone")}
                value={profile.timezone || "—"}
              />
              {chart ? (
                <MetaRow label={pick("AD मिति", "AD date")} value={chart.adDate} />
              ) : null}
            </Card>

            <Card className="gap-2">
              <Text className="text-sm font-semibold text-foreground" style={nepaliTextStyle(14)}>
                {pick("पूर्ण कुण्डली", "Full chart")}
              </Text>
              <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
                {pick(
                  "विस्तृत कुण्डली (D1, दशा, योग आदि) छिट्टै मोबाइलमा थपिनेछ। अहिले प्रोफाइल विवरण र सूची हेर्न सक्नुहुन्छ।",
                  "Detailed chart sections (D1, dasha, yogas, etc.) are coming soon on mobile. Profile details and list are available now.",
                )}
              </Text>
            </Card>

            <KundaliProfilePicker
              ref={pickerRef}
              selectedId={profile.id}
              onSelect={(p) => router.replace(`/kundali/${p.id}` as never)}
            />
          </View>
        )}
      </KundaliPageShell>

      <AuthDialog
        key={authMode}
        open={authOpen}
        onOpenChange={setAuthOpen}
        initialMode={authMode}
      />
    </>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row gap-2">
      <Text className="w-28 shrink-0 text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
        {label}
      </Text>
      <Text className="min-w-0 flex-1 text-sm text-foreground" style={nepaliTextStyle(14)}>
        {value}
      </Text>
    </View>
  );
}
