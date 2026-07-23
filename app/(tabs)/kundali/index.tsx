import { useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AuthDialog } from "@/components/auth/AuthDialog";
import {
  KundaliProfilePicker,
  type KundaliProfilePickerHandle,
} from "@/components/kundali/KundaliProfilePicker";
import { KundaliLoginPrompt } from "@/components/kundali/KundaliLoginPrompt";
import { KundaliPageShell } from "@/components/kundali/KundaliPageShell";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/AuthContext";
import { type Profile } from "@/lib/auth/client";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";

export default function KundaliScreen() {
  const { pick } = useLocale();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const pickerRef = useRef<KundaliProfilePickerHandle>(null);

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const onSelectProfile = (profile: Profile) => {
    router.push(`/kundali/${profile.id}` as never);
  };

  return (
    <>
      <KundaliPageShell
        eyebrow={pick("ज्योतिष", "Jyotish")}
        title={pick("जन्मकुण्डली", "Birth chart")}
        subtitle={
          isAuthenticated
            ? pick("सेभ गरिएका प्रोफाइलबाट कुण्डली बनाउनुहोस्।", "Generate kundali from saved profiles.")
            : pick("कुण्डली बनाउन लगइन गर्नुहोस्।", "Log in to create and view kundali profiles.")
        }
        headerRight={
          isAuthenticated ? (
            <Button
              label={pick("प्रोफाइल थप", "Add profile")}
              size="sm"
              onPress={() => pickerRef.current?.openAdd()}
            />
          ) : undefined
        }
      >
        {authLoading ? (
          <View className="items-center rounded-xl border border-dashed border-border bg-muted/20 px-5 py-12">
            <ActivityIndicator />
            <Text className="mt-2 text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
              {pick("लोड हुँदै…", "Loading…")}
            </Text>
          </View>
        ) : !isAuthenticated ? (
          <KundaliLoginPrompt
            titleNe="कुण्डलीका लागि लगइन"
            titleEn="Log in for kundali"
            bodyNe="प्रोफाइल बनाउन र जन्मकुण्डली हेर्न खाता चाहिन्छ।"
            bodyEn="An account is required to save profiles and view birth charts."
            onLogin={() => openAuth("login")}
            onSignup={() => openAuth("signup")}
          />
        ) : (
          <View className="gap-4">
            <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
              {pick(
                "प्रोफाइल छान्नुहोस् वा नयाँ थप्नुहोस्।",
                "Select a profile or add a new one.",
              )}
            </Text>
            <KundaliProfilePicker ref={pickerRef} selectedId={null} onSelect={onSelectProfile} />
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
