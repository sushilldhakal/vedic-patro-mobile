import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RashiGlyphIcon } from "@/components/panchanga/element/ElementGlyphIcon";
import { getRashiName } from "@/lib/rashi-i18n";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { RashifalPersonal } from "@/lib/api";
import {
  RASHIFAL_DOMAIN_ICON,
  rashifalToneBar,
  rashifalToneText,
  toNepaliDigits,
} from "@/lib/rashifal-ui";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { useThemeColors } from "@/lib/theme-context";

type Props = {
  name: string;
  personal: RashifalPersonal;
};

function StarMeter({ stars, tone }: { stars: number; tone: RashifalPersonal["tone"] }) {
  return (
    <View className="flex-row gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <View
          key={n}
          className={cn("size-1.5 rounded-full", n <= stars ? rashifalToneBar(tone) : "bg-border")}
        />
      ))}
    </View>
  );
}

export function RashifalPersonalCard({ name, personal }: Props) {
  const { lang, pick, digits } = useLocale();
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);

  const ne = lang === "ne";
  const prediction = ne ? personal.prediction_ne : personal.prediction_en;
  const luckyColor = ne ? personal.lucky_color_ne : personal.lucky_color_en;
  const luckyNumber = ne ? personal.lucky_number_ne : personal.lucky_number_en;
  const luckyDirection = ne ? personal.lucky_direction_ne : personal.lucky_direction_en;
  const lord = personal.rashi_lord;
  const dasha = personal.dasha;
  const pct = personal.percent ?? 50;

  return (
    <View className="overflow-hidden rounded-xl border border-secondary/40 bg-card">
      <View className="flex-row items-start gap-3 border-b border-border bg-secondary/10 px-4 py-3">
        <RashiGlyphIcon name={getRashiName(personal.moon_sign, lang)} number={personal.moon_sign} size={36} />
        <View className="min-w-0 flex-1">
          <Text className="text-base font-bold text-foreground" style={nepaliTextStyle(16)}>
            {name}
          </Text>
          <Text className="mt-1 text-xs text-muted-foreground">
            {pick("व्यक्तिगत राशिफल", "Personal rashifal")} ·{" "}
            {ne ? personal.moon_sign_ne : personal.moon_sign_en}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2.5 border-b border-border/60 px-4 py-2.5">
        <StarMeter stars={personal.stars ?? 3} tone={personal.tone} />
        <View className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
          <View className={cn("h-full rounded-full", rashifalToneBar(personal.tone))} style={{ width: `${pct}%` }} />
        </View>
        <Text className={cn("text-xs font-bold tabular-nums", rashifalToneText(personal.tone))}>
          {digits(pct)}%
        </Text>
      </View>

      {personal.domains?.length ? (
        <View className="flex-row flex-wrap border-b border-border/60 px-4 py-3">
          {personal.domains.map((domain) => {
            const icon = RASHIFAL_DOMAIN_ICON[domain.key];
            const label = ne ? domain.label_ne : domain.label_en;
            return (
              <View key={domain.key} className="mb-2 w-1/3 min-w-0 px-1">
                <View className="flex-row items-center gap-1">
                  <Ionicons name={icon} size={14} color={colors.mutedForeground} />
                  <Text className="flex-1 text-[10px] font-semibold text-muted-foreground" numberOfLines={1}>
                    {label}
                  </Text>
                </View>
                <View className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                  <View
                    className={cn("h-full rounded-full", rashifalToneBar(domain.tone))}
                    style={{ width: `${domain.percent}%` }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      <Text className="px-4 py-3.5 text-sm leading-relaxed text-foreground/90" style={nepaliTextStyle(14)}>
        {prediction}
      </Text>

      <View className="gap-1 border-t border-border bg-muted/25 px-4 py-2.5">
        <Text className="text-xs text-muted-foreground">
          {pick("शुभ रङ", "Lucky color")}: {luckyColor} · {pick("अंक", "Number")}: {luckyNumber}
        </Text>
        {luckyDirection ? (
          <Text className="text-xs text-muted-foreground">
            {pick("दिशा", "Direction")}: {luckyDirection}
          </Text>
        ) : null}
        {dasha ? (
          <Text className="text-xs text-muted-foreground">
            {pick("महादशा", "Mahadasha")}: {ne ? dasha.mahadasha.lord_ne : dasha.mahadasha.lord_en} ·{" "}
            {pick("अन्तर्दशा", "Antardasha")}: {ne ? dasha.antardasha.lord_ne : dasha.antardasha.lord_en}
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center justify-between border-t border-border px-4 py-2.5 active:opacity-80"
      >
        <Text className="text-xs font-semibold text-muted-foreground">
          {pick("विवरण", "Details")}
        </Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
      </Pressable>

      {open ? (
        <View className="border-t border-border bg-surface-muted px-4 py-3">
          {personal.components?.map((component) => (
            <View key={component.key} className="mb-1.5 flex-row items-baseline gap-2">
              <Text className="w-24 shrink-0 text-xs font-semibold text-foreground">
                {ne ? component.label_ne : component.label_en}
              </Text>
              <Text className="min-w-0 flex-1 text-xs text-muted-foreground">
                {ne ? component.note_ne : component.note_en}
              </Text>
              <Text className={cn("shrink-0 text-xs font-bold", rashifalToneText(component.tone))}>
                {toNepaliDigits(component.percent, lang)}
              </Text>
            </View>
          ))}
          {lord ? (
            <Text className="mt-2 text-xs text-muted-foreground">
              {pick(
                `${lord.lord_ne} · ${lord.house}`,
                `${lord.lord_en} · house ${lord.house}`,
              )}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
