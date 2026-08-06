import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppShell, LangToggle } from "@/components/AppShell";
import { useBreakpoint } from "@/lib/responsive";
import { Card } from "@/components/ui/Card";
import { API_BASE } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import { useThemeColors } from "@/lib/theme-context";
import {
  SITEMAP_ELEMENT_IDS,
  SITEMAP_LEARN_SLUGS,
  SITEMAP_ROUTES,
  SITEMAP_SAIT_CATEGORIES,
} from "@/lib/sitemap-routes";
import { CEREMONY_META, ELEMENT_BY_ID } from "@/lib/panchanga-elements";
import { LEARN_TOPIC_METAS } from "@/lib/learn/learn-topics-meta";
import type { MobileNavIcon } from "@/lib/mobile-nav";

function RouteRow({
  path,
  label,
  icon,
}: {
  path: string;
  label: string;
  icon: MobileNavIcon;
}) {
  const router = useRouter();
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={() => router.push(path as never)}
      className="flex-row items-center gap-3 border-b border-border/40 py-3 active:opacity-80"
    >
      <Ionicons name={icon} size={20} color={colors.secondary} />
      <Text className="flex-1 text-sm font-medium text-foreground">{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function MoreScreen() {
  const { pick } = useLocale();
  const { isTablet } = useBreakpoint();

  const learnExtra = SITEMAP_LEARN_SLUGS.map((slug) => {
    const meta = LEARN_TOPIC_METAS.find((t) => t.slug === slug);
    return {
      path: `/learn/${slug}`,
      label: meta ? pick(meta.titleNe, meta.titleEn) : slug,
      icon: (meta?.icon ?? "book-outline") as MobileNavIcon,
    };
  });

  const elementRoutes = SITEMAP_ELEMENT_IDS.map((id) => {
    const meta = ELEMENT_BY_ID[id];
    return {
      path: `/panchanga/element/${id}`,
      label: meta ? pick(meta.titleNe, meta.titleEn) : id,
      icon: "grid-outline" as MobileNavIcon,
    };
  });

  const saitRoutes = SITEMAP_SAIT_CATEGORIES.map((id) => {
    const meta = CEREMONY_META.find((c) => c.id === id);
    const path = id === "vivah" ? "/vivah-sait" : `/sait/${id}`;
    return {
      path,
      label: meta ? pick(meta.titleNe, meta.titleEn) : id,
      icon: "heart-outline" as MobileNavIcon,
    };
  });

  const { isCalendarWide } = useBreakpoint();

  return (
    <AppShell title={pick("थप", "More")} showHeader={false}>
      {!isCalendarWide ? (
        <View className="mb-3 flex-row justify-end">
          <LangToggle />
        </View>
      ) : null}
      <View className={isTablet ? "flex-row flex-wrap gap-4" : "gap-4"}>
        <Card className={isTablet ? "min-w-[45%] flex-1" : ""}>
          <Text className="mb-2 text-base font-semibold text-foreground">
            {pick("मुख्य", "Main")}
          </Text>
          {SITEMAP_ROUTES.map((r) => (
            <RouteRow
              key={r.path}
              path={r.path}
              label={pick(r.ne, r.en)}
              icon={r.icon}
            />
          ))}
        </Card>

        <Card className={isTablet ? "min-w-[45%] flex-1" : ""}>
          <Text className="mb-2 text-base font-semibold text-foreground">
            {pick("पञ्चाङ्ग तत्त्व", "Panchanga elements")}
          </Text>
          {elementRoutes.map((r) => (
            <RouteRow key={r.path} path={r.path} label={r.label} icon={r.icon} />
          ))}
        </Card>

        <Card className={isTablet ? "min-w-[45%] flex-1" : ""}>
          <Text className="mb-2 text-base font-semibold text-foreground">
            {pick("सिकाइ लेख", "Learn articles")}
          </Text>
          <RouteRow
            path="/learn/history"
            label={pick("इतिहास", "History")}
            icon="time-outline"
          />
          {learnExtra.map((r) => (
            <RouteRow key={r.path} path={r.path} label={r.label} icon={r.icon} />
          ))}
        </Card>

        <Card className={isTablet ? "w-full" : ""}>
          <Text className="mb-2 text-base font-semibold text-foreground">
            {pick("शुभ साइत", "Ceremony muhurta")}
          </Text>
          {saitRoutes.map((r) => (
            <RouteRow key={r.path} path={r.path} label={r.label} icon={r.icon} />
          ))}
        </Card>

        <Card>
          <Text className="mb-1 text-sm font-semibold text-foreground">API</Text>
          <Text className="font-mono text-xs text-muted-foreground">{API_BASE}</Text>
          <Text className="mt-2 text-xs text-muted-foreground">
            {pick("संस्करण 1.1.0 · Android & iOS (Expo)", "Version 1.1.0 · Android & iOS (Expo)")}
          </Text>
        </Card>
      </View>
    </AppShell>
  );
}
