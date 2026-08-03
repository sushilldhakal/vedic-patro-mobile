import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/Text";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Card } from "@/components/ui/Card";
import { CEREMONY_META, ELEMENT_META } from "@/lib/panchanga-elements";
import { useLocale } from "@/lib/i18n";
import { useThemeColors } from "@/lib/theme-context";

import type { MobileNavIcon } from "@/lib/mobile-nav";

type LinkItem = {
  href: string;
  titleNe: string;
  titleEn: string;
  blurbNe?: string;
  blurbEn?: string;
  icon: MobileNavIcon;
};

const GRAHA_LINKS: LinkItem[] = [
  {
    href: "/gochar",
    titleNe: "गोचर",
    titleEn: "Gochar",
    blurbNe: "ग्रह गोचर र प्रवेश",
    blurbEn: "Transits & ingress",
    icon: "git-branch-outline",
  },
  {
    href: "/panchanga/graha-sthiti",
    titleNe: "ग्रह स्थिति",
    titleEn: "Graha sthiti",
    icon: "planet-outline",
  },
  {
    href: "/panchanga/graha-asta",
    titleNe: "ग्रह अस्त",
    titleEn: "Heliacal set",
    icon: "sunny-outline",
  },
  {
    href: "/panchanga/graha-vakri",
    titleNe: "ग्रह वक्री",
    titleEn: "Retrograde",
    icon: "refresh-outline",
  },
  {
    href: "/panchanga/chandra-grahan",
    titleNe: "चन्द्र ग्रहण",
    titleEn: "Lunar eclipse",
    icon: "moon-outline",
  },
  {
    href: "/panchanga/surya-grahan",
    titleNe: "सूर्य ग्रहण",
    titleEn: "Solar eclipse",
    icon: "ellipse-outline",
  },
];

function SectionTitle({ ne, en }: { ne: string; en: string }) {
  const { pick } = useLocale();
  return (
    <Text className="mb-2 mt-4 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
      {pick(ne, en)}
    </Text>
  );
}

function LinkGrid({ items }: { items: LinkItem[] }) {
  const { pick } = useLocale();
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <View className="flex-row flex-wrap gap-2">
      {items.map((item) => (
        <Pressable
          key={item.href}
          onPress={() => router.push(item.href as never)}
          className="min-w-[46%] flex-1 active:opacity-85"
        >
          <Card className="min-h-[88px] gap-1 p-3">
            <Ionicons name={item.icon} size={20} color={colors.secondary} />
            <Text className="text-sm font-semibold text-foreground">{pick(item.titleNe, item.titleEn)}</Text>
            {item.blurbNe ? (
              <Text className="text-[11px] leading-snug text-muted-foreground">
                {pick(item.blurbNe, item.blurbEn ?? item.blurbNe)}
              </Text>
            ) : null}
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

/** Categorized links — mirrors web PanchangaDirectory. */
export function PanchangaDirectoryMobile() {
  const { pick } = useLocale();
  const router = useRouter();

  const spanLinks: LinkItem[] = ELEMENT_META.filter((e) => e.kind === "span").map((e) => ({
    href: `/panchanga/element/${e.id}`,
    titleNe: e.titleNe,
    titleEn: e.titleEn,
    blurbNe: e.blurbNe,
    blurbEn: e.blurbEn,
    icon: "arrow-forward-circle-outline",
  }));

  const tableLinks: LinkItem[] = ELEMENT_META.filter((e) => e.kind === "table").map((e) => ({
    href: `/panchanga/element/${e.id}`,
    titleNe: e.titleNe,
    titleEn: e.titleEn,
    blurbNe: e.blurbNe,
    blurbEn: e.blurbEn,
    icon: "grid-outline",
  }));

  const saitLinks: LinkItem[] = CEREMONY_META.map((c) => ({
    href: `/sait/${c.id}`,
    titleNe: c.titleNe,
    titleEn: c.titleEn,
    icon: "heart-outline",
  }));

  return (
    <View className="gap-1 pb-6">
      <SectionTitle ne="संक्रमण तत्त्व" en="Transition elements" />
      <LinkGrid items={spanLinks} />

      <SectionTitle ne="ग्रह विवरण" en="Planet details" />
      <LinkGrid items={GRAHA_LINKS} />

      <SectionTitle ne="दैनिक तालिका" en="Daily tables" />
      <LinkGrid items={tableLinks} />

      <SectionTitle ne="शुभ मुहूर्त" en="Auspicious muhurta" />
      <LinkGrid items={saitLinks} />

      <Pressable onPress={() => router.push("/vivah-sait" as never)} className="mt-2">
        <Card className="border-secondary/30 bg-secondary/5 p-3">
          <Text className="text-sm font-semibold text-secondary">
            {pick("विवाह साइत (विस्तृत)", "Marriage muhurta (full)")}
          </Text>
        </Card>
      </Pressable>
    </View>
  );
}
