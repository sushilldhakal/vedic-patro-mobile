import { Text, View } from "react-native";
import type { CalendarDay, PanchangaDay } from "@/lib/api";
import { timeShort } from "@/lib/api";
import { useLocale } from "@/lib/i18n";

type Props = {
  p?: PanchangaDay;
  selectedDay?: CalendarDay | null;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-3 border-b border-border/60 py-2.5">
      <Text className="flex-1 text-sm text-muted-foreground">{label}</Text>
      <Text className="flex-1 text-right text-sm font-medium text-foreground">{value}</Text>
    </View>
  );
}

export function PanchangaVivaranPanel({ p, selectedDay }: Props) {
  const { pick, lang } = useLocale();
  const t = (ne?: string, en?: string) => (lang === "ne" ? ne || en : en || ne) || "—";

  if (!p && !selectedDay) {
    return (
      <Text className="py-6 text-center text-sm text-muted-foreground">
        {pick("विवरण छैन।", "No details.")}
      </Text>
    );
  }

  return (
    <View>
      <Row
        label={pick("तिथि", "Tithi")}
        value={t(p?.tithi?.name_ne ?? selectedDay?.tithi_ne, p?.tithi?.name ?? selectedDay?.tithi)}
      />
      <Row
        label={pick("नक्षत्र", "Nakshatra")}
        value={t(p?.nakshatra?.name_ne, p?.nakshatra?.name)}
      />
      <Row label={pick("योग", "Yoga")} value={t(p?.yoga?.name_ne, p?.yoga?.name)} />
      <Row label={pick("करण", "Karana")} value={t(p?.karana?.name_ne, p?.karana?.name)} />
      <Row label={pick("पक्ष", "Paksha")} value={t(p?.paksha?.label_ne, p?.paksha?.label_en)} />
      <Row label={pick("सूर्योदय", "Sunrise")} value={timeShort(p?.sunrise)} />
      <Row label={pick("सूर्यास्त", "Sunset")} value={timeShort(p?.sunset)} />
      <Row label={pick("चन्द्रोदय", "Moonrise")} value={timeShort(p?.moonrise)} />
      <Row label={pick("चन्द्रास्त", "Moonset")} value={timeShort(p?.moonset)} />
      {p?.festivals?.length ? (
        <View className="border-t border-border/60 pt-2">
          <Text className="mb-1 text-sm font-semibold text-foreground">
            {pick("पर्व / बिदा", "Festivals / Holidays")}
          </Text>
          {p.festivals.map((f, i) => (
            <Text key={`${f.name}-${i}`} className="py-0.5 text-sm text-foreground">
              • {t(f.name_ne, f.name)}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
