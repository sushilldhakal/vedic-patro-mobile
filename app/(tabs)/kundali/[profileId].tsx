import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AuthDialog } from "@/components/auth/AuthDialog";
import {
  AshtakavargaCard,
  AvakahadaCard,
  BhavaBalaCard,
  BhavaTable,
  DashaTree,
  GrahaAstroTable,
  KundaliSection,
  ShadbalaCard,
  UpagrahaTable,
  YogaList,
  grahaName,
} from "@/components/kundali/KundaliSections";
import { KundaliLoginPrompt } from "@/components/kundali/KundaliLoginPrompt";
import { KundaliPageShell } from "@/components/kundali/KundaliPageShell";
import {
  KundaliProfilePicker,
  type KundaliProfilePickerHandle,
} from "@/components/kundali/KundaliProfilePicker";
import { ShantiVidhiPanel } from "@/components/kundali/ShantiVidhiPanel";
import { D1Chart } from "@/components/panchanga/D1Chart";
import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { fetchKundaliDetail, kundaliDetailKeys, type VargaChartEntry } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { buildBhavaChart } from "@/lib/bhava";
import { GRAHA_NAME, type GrahaKey } from "@/lib/graha-details";
import { useLocale } from "@/lib/i18n";
import { instantFromCivilIso } from "@/lib/instant-query";
import { profileChartParams } from "@/lib/kundali/profile-chart";
import { useProfilesQuery } from "@/lib/kundali/profiles-query";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { formatRashiByNumber, rashiNeFromNumber } from "@/lib/rashi-i18n";
import { useBreakpoint } from "@/lib/responsive";
import { useThemeColors } from "@/lib/theme-context";

/** Vertical divisions the server ships; D1 + D9 lead, the rest follow. */
const PRIMARY_DIVISIONS = [1, 9];

function StatTile({
  label,
  value,
  sub,
  width,
}: {
  label: string;
  value: string;
  sub?: string;
  width: string;
}) {
  return (
    <View
      style={{ width: width as never }}
      className="rounded-xl border border-border bg-card px-3.5 py-3"
    >
      <Text
        numberOfLines={1}
        className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
        style={nepaliTextStyle(10)}
      >
        {label}
      </Text>
      <Text className="text-base font-bold leading-tight text-foreground" style={nepaliTextStyle(15)}>
        {value}
      </Text>
      {sub ? (
        <Text className="mt-0.5 text-xs text-muted-foreground" style={nepaliTextStyle(11)}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

export default function KundaliDetailScreen() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  const { lang, pick, digits } = useLocale();
  const router = useRouter();
  const colors = useThemeColors();
  const { width } = useBreakpoint();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [division, setDivision] = useState(1);
  const pickerRef = useRef<KundaliProfilePickerHandle>(null);
  const { data: profiles, isLoading: profilesLoading } = useProfilesQuery(isAuthenticated);

  const profile = useMemo(
    () => profiles?.find((p) => p.id === profileId) ?? null,
    [profiles, profileId],
  );
  const chart = profile ? profileChartParams(profile) : null;

  const moment = useMemo(
    () => (chart ? instantFromCivilIso(chart.adDate, chart.clock) : null),
    [chart],
  );

  const detailQuery = useQuery({
    queryKey: kundaliDetailKeys.atTime(moment!, chart?.location.params),
    queryFn: () => fetchKundaliDetail(moment!, chart?.location.params),
    enabled: Boolean(moment),
    staleTime: 1000 * 60 * 10,
    placeholderData: keepPreviousData,
  });

  const detail = detailQuery.data;

  const d1Rows: VargaChartEntry[] = detail?.vargaCharts.entries["1"] ?? [];
  const divisions = detail?.vargaCharts.divisions ?? PRIMARY_DIVISIONS;

  /** North-Indian chart houses for the selected division. */
  const houses = useMemo(() => {
    if (!detail) return [];
    const entries = detail.vargaCharts.entries[String(division)] ?? [];
    const lagna = entries.find((e) => e.key === "lagna");
    if (!lagna) return [];
    const planetRashis = entries
      .filter((e) => e.key !== "lagna")
      .map((e) => ({
        key: e.key,
        labelNe: GRAHA_NAME[e.key as GrahaKey]?.ne ?? e.key,
        rashi: e.vargaRashi,
      }));
    return buildBhavaChart(lagna.vargaRashi, planetRashis, rashiNeFromNumber);
  }, [detail, division]);

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const tileCols = width >= 1024 ? 4 : width >= 640 ? 3 : 2;
  const tileWidth = `${(100 / tileCols - 1.5).toFixed(2)}%`;

  const panchanga = detail?.panchanga;
  const birthMeta = detail?.birthMeta;

  const renderBody = () => {
    if (authLoading || (isAuthenticated && profilesLoading && !profile)) {
      return (
        <View className="items-center rounded-xl border border-dashed border-border bg-muted/20 px-5 py-12">
          <ActivityIndicator />
        </View>
      );
    }

    if (!isAuthenticated) {
      return (
        <KundaliLoginPrompt
          titleNe="कुण्डली हेर्न लगइन"
          titleEn="Log in to view kundali"
          bodyNe="यो कुण्डली हेर्न साइन इन गर्नुहोस्।"
          bodyEn="Sign in to view this birth chart."
          onLogin={() => openAuth("login")}
          onSignup={() => openAuth("signup")}
        />
      );
    }

    if (!profile) {
      return (
        <Card>
          <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
            {pick("प्रोफाइल फेला परेन।", "Profile not found.")}
          </Text>
        </Card>
      );
    }

    if (!chart) {
      return (
        <Card>
          <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
            {pick(
              "यो प्रोफाइलमा जन्म मिति छैन — खातामा गएर थप्नुहोस्।",
              "This profile has no birth date — add one in your account.",
            )}
          </Text>
        </Card>
      );
    }

    if (detailQuery.isLoading && !detail) {
      return (
        <View className="items-center rounded-xl border border-dashed border-border bg-muted/20 px-5 py-12">
          <ActivityIndicator />
          <Text className="mt-3 text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
            {pick("कुण्डली गणना हुँदै…", "Computing the chart…")}
          </Text>
        </View>
      );
    }

    if (!detail) {
      return (
        <Card>
          <Text style={{ color: colors.destructive, ...nepaliTextStyle(14) }} className="text-sm">
            {pick(
              "कुण्डली ल्याउन सकिएन। मिति/समय/स्थान जाँचेर पुनः प्रयास गर्नुहोस्।",
              "Could not load the chart. Check the date, time and place and try again.",
            )}
          </Text>
        </Card>
      );
    }

    return (
      <View>
        {/* birth summary */}
        <View className="mb-4 flex-row flex-wrap gap-2">
          <StatTile
            width={tileWidth}
            label={pick("जन्म मिति", "Birth date")}
            value={`${profile.birth_date ?? chart.adDate}`}
            sub={(profile.birth_era ?? "bs").toUpperCase()}
          />
          <StatTile
            width={tileWidth}
            label={pick("जन्म समय", "Birth time")}
            value={digits(birthMeta?.birthClock ?? chart.clock)}
            sub={
              birthMeta?.isDayBirth == null
                ? undefined
                : birthMeta.isDayBirth
                  ? pick("दिवा जन्म", "Day birth")
                  : pick("रात्रि जन्म", "Night birth")
            }
          />
          <StatTile
            width={tileWidth}
            label={pick("जन्म स्थान", "Birth place")}
            value={profile.location_label || profile.city || "—"}
            sub={profile.timezone || undefined}
          />
          <StatTile
            width={tileWidth}
            label={pick("लग्न", "Lagna")}
            value={
              detail.lagnaRashi ? formatRashiByNumber(detail.lagnaRashi, lang) : "—"
            }
            sub={detail.ayanamsha}
          />
        </View>

        {/* chart */}
        <KundaliSection
          title={pick("कुण्डली चक्र", "Chart")}
          subtitle={pick("उत्तर भारतीय शैली", "North Indian style")}
          icon="grid-outline"
        >
          {divisions.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, paddingBottom: 10 }}
            >
              {divisions.map((d) => {
                const active = d === division;
                return (
                  <Pressable
                    key={d}
                    onPress={() => setDivision(d)}
                    style={{
                      backgroundColor: active ? colors.secondary : colors.surfaceInset,
                      borderColor: active ? colors.secondary : colors.border,
                    }}
                    className="rounded-lg border px-3 py-1.5 active:opacity-80"
                  >
                    <Text
                      style={{ color: active ? "#ffffff" : colors.foreground }}
                      className="font-num text-xs font-bold"
                    >
                      D{digits(d)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
          {houses.length ? (
            <View className="items-center">
              <D1Chart houses={houses} />
            </View>
          ) : null}
        </KundaliSection>

        <KundaliSection
          title={pick("ग्रह स्पष्ट", "Graha positions")}
          subtitle={pick("D१ — राशि, अंश, नक्षत्र र स्वामी", "D1 — sign, degree, nakshatra & lords")}
          icon="planet-outline"
        >
          <GrahaAstroTable
            d1Rows={d1Rows}
            points={detail.vargaCharts.points}
            combustion={detail.combustion}
          />
        </KundaliSection>

        <KundaliSection
          title={pick("भाव विवरण", "Bhava table")}
          subtitle={pick("स्थित ग्रह, स्वामी र दृष्टि", "Residents, lords and aspects")}
          icon="home-outline"
        >
          <BhavaTable division={division} anchorKey="lagna" vargaCharts={detail.vargaCharts} />
        </KundaliSection>

        {detail.avakahada ? (
          <KundaliSection
            title={pick("जन्म अवकहडा", "Janma Avakahada")}
            subtitle={pick("नक्षत्रबाट निस्कने जन्म विवरण", "Birth traits from the natal nakshatra")}
            icon="star-outline"
          >
            <AvakahadaCard data={detail.avakahada} />
          </KundaliSection>
        ) : null}

        {detail.dasha?.tree?.length ? (
          <KundaliSection
            title={pick("विंशोत्तरी दशा", "Vimshottari Dasha")}
            subtitle={pick("महादशा — थिच्नुहोस् अन्तर्दशा हेर्न", "Mahadasha — tap to open sub-periods")}
            icon="time-outline"
          >
            <DashaTree tree={detail.dasha.tree} />
          </KundaliSection>
        ) : null}

        <KundaliSection
          title={pick("षड्बल", "Shadbala")}
          subtitle={pick("ग्रह बल — रूपमा", "Planetary strength, in rupas")}
          icon="barbell-outline"
        >
          <ShadbalaCard shadbala={detail.shadbala} />
        </KundaliSection>

        {detail.bhavaBala ? (
          <KundaliSection
            title={pick("भाव बल", "Bhava Bala")}
            subtitle={pick("भावको सापेक्ष बल", "Relative house strength")}
            icon="stats-chart-outline"
          >
            <BhavaBalaCard data={detail.bhavaBala} />
          </KundaliSection>
        ) : null}

        {detail.ashtakavarga ? (
          <KundaliSection
            title={pick("अष्टकवर्ग", "Ashtakavarga")}
            subtitle={pick("प्रस्तार र शोधित बिन्दु", "Raw and reduced bindus")}
            icon="apps-outline"
          >
            <AshtakavargaCard data={detail.ashtakavarga} />
          </KundaliSection>
        ) : null}

        {detail.upagrahas?.length ? (
          <KundaliSection
            title={pick("उपग्रह", "Upagrahas")}
            subtitle={pick("गुलिक, माण्डी आदि", "Gulika, Mandi and the rest")}
            icon="ellipse-outline"
          >
            <UpagrahaTable rows={detail.upagrahas} />
          </KundaliSection>
        ) : null}

        <KundaliSection
          title={pick("योग", "Yogas")}
          subtitle={pick("कुण्डलीमा बनेका योग", "Combinations present in this chart")}
          icon="sparkles-outline"
        >
          <YogaList yogas={detail.yogas} />
        </KundaliSection>

        <KundaliSection
          title={pick("शान्ति विधि", "Shanti Vidhi")}
          subtitle={pick("यस कुण्डलीका लागि उपाय", "Remedies for this chart")}
          icon="flame-outline"
        >
          <ShantiVidhiPanel vimshottari={detail.dasha ?? undefined} shadbala={detail.shadbala} />
        </KundaliSection>

        <KundaliProfilePicker
          ref={pickerRef}
          selectedId={profile.id}
          onSelect={(p) => router.replace(`/kundali/${p.id}` as never)}
        />
      </View>
    );
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
        {renderBody()}
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
