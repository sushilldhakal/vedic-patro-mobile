import { useState } from "react";
import { Pressable, View } from "react-native";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { AppShell } from "@/components/AppShell";
import { PatroPageHeader } from "@/components/patro-date/PatroPageHeader";
import { Text } from "@/components/ui/Text";
import { useLocale } from "@/lib/i18n";
import { NOTO_DEVANAGARI_BOLD, NOTO_DEVANAGARI_SEMIBOLD } from "@/lib/fonts";
import { nepaliSvgTextCenter, nepaliTextStyle } from "@/lib/nepali-text";
import { useBreakpoint } from "@/lib/responsive";
import { useThemeColors } from "@/lib/theme-context";
import {
  VASTU_DIRECTIONS,
  VASTU_DOSHAS,
  VASTU_ELEMENT_COLOR,
  VASTU_GUNA_COLOR,
  VASTU_INK,
  VASTU_ROOMS,
  VASTU_WHEEL_DIRECTIONS,
  vastuDirection,
  vastuWheelPoint,
  type VastuDirectionId,
} from "@/lib/vastu";
import { cn } from "@/lib/utils";

const WHEEL_SIZE = 320;
const CX = WHEEL_SIZE / 2;
const CY = WHEEL_SIZE / 2;
const OUTER_R = 152;
const INNER_R = 58;
const LABEL_R = (OUTER_R + INNER_R) / 2;

/**
 * react-native-svg types `onPress` as an unsatisfiable intersection; it works
 * fine at runtime. Same shim `WheelChart` and the Avakahada wheel use.
 */
const press = (fn: () => void) => fn as never;

/** Annular sector for one 45° slice, centred on `bearing`. */
function sectorPath(bearing: number): string {
  const from = bearing - 22.5;
  const to = bearing + 22.5;
  const o1 = vastuWheelPoint(from, OUTER_R, CX, CY);
  const o2 = vastuWheelPoint(to, OUTER_R, CX, CY);
  const i1 = vastuWheelPoint(to, INNER_R, CX, CY);
  const i2 = vastuWheelPoint(from, INNER_R, CX, CY);
  return [
    `M ${o1.x.toFixed(2)} ${o1.y.toFixed(2)}`,
    `A ${OUTER_R} ${OUTER_R} 0 0 1 ${o2.x.toFixed(2)} ${o2.y.toFixed(2)}`,
    `L ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,
    `A ${INNER_R} ${INNER_R} 0 0 0 ${i2.x.toFixed(2)} ${i2.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function SectionCard({
  icon,
  title,
  meta,
  children,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  meta?: string;
  children: React.ReactNode;
}) {
  const colors = useThemeColors();
  return (
    <View className="mb-4 overflow-hidden rounded-2xl border border-border">
      <View className="flex-row items-center gap-1.5 border-b border-border px-4 py-3">
        <Ionicons name={icon} size={16} color={colors.secondary} />
        <Text className="min-w-0 flex-1 text-sm font-semibold text-foreground" style={nepaliTextStyle(14)}>
          {title}
        </Text>
        {meta ? (
          <Text className="shrink-0 text-sm text-muted-foreground" style={nepaliTextStyle(13)}>
            {meta}
          </Text>
        ) : null}
      </View>
      <View className="gap-3 p-4">{children}</View>
    </View>
  );
}

function DirectionWheel({
  size,
  selected,
  onSelect,
}: {
  size: number;
  selected: VastuDirectionId;
  onSelect: (id: VastuDirectionId) => void;
}) {
  const { t } = useLocale();
  const colors = useThemeColors();

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}>
      {VASTU_WHEEL_DIRECTIONS.map((dir) => {
        const active = dir.id === selected;
        const color = VASTU_ELEMENT_COLOR[dir.element];
        const label = vastuWheelPoint(dir.bearing, LABEL_R, CX, CY);
        return (
          <G key={dir.id} onPress={press(() => onSelect(dir.id))}>
            <Path
              d={sectorPath(dir.bearing)}
              fill={color}
              fillOpacity={active ? 0.42 : 0.14}
              stroke={color}
              strokeOpacity={active ? 1 : 0.35}
              strokeWidth={active ? 2.5 : 1}
            />
            <SvgText
              x={label.x}
              y={label.y}
              textAnchor="middle"
              {...nepaliSvgTextCenter}
              fontSize={15}
              fontFamily={active ? NOTO_DEVANAGARI_BOLD : NOTO_DEVANAGARI_SEMIBOLD}
              fill={colors.foreground}
              fillOpacity={active ? 1 : 0.75}
            >
              {t(`vastu.dir.${dir.id}.name`)}
            </SvgText>
          </G>
        );
      })}

      <G onPress={press(() => onSelect("center"))}>
        <Circle
          cx={CX}
          cy={CY}
          r={INNER_R - 6}
          fill={VASTU_ELEMENT_COLOR.space}
          fillOpacity={selected === "center" ? 0.4 : 0.12}
          stroke={VASTU_ELEMENT_COLOR.space}
          strokeOpacity={selected === "center" ? 1 : 0.35}
          strokeWidth={selected === "center" ? 2.5 : 1}
        />
        <SvgText
          x={CX}
          y={CY}
          textAnchor="middle"
          {...nepaliSvgTextCenter}
          fontSize={13}
          fontFamily={NOTO_DEVANAGARI_BOLD}
          fill={colors.foreground}
        >
          {t("vastu.dir.center.name")}
        </SvgText>
      </G>
    </Svg>
  );
}

function DirectionDetail({ id }: { id: VastuDirectionId }) {
  const { t } = useLocale();
  const dir = vastuDirection(id);
  const color = VASTU_ELEMENT_COLOR[dir.element];
  const gunaColor = VASTU_GUNA_COLOR[dir.guna];
  const gunaFg = dir.guna === "tamas" ? VASTU_INK.background : gunaColor;

  const row = (label: string, value: string, danger?: boolean) => (
    <View className="flex-row gap-3">
      <Text
        className="w-[88px] shrink-0 text-sm font-semibold text-muted-foreground"
        style={nepaliTextStyle(13)}
      >
        {label}
      </Text>
      <Text
        className={cn("min-w-0 flex-1 text-sm", danger ? "text-danger" : "text-foreground")}
        style={nepaliTextStyle(13)}
      >
        {value}
      </Text>
    </View>
  );

  return (
    <View className="rounded-2xl border bg-card p-4" style={{ borderColor: `${color}66` }}>
      <View className="flex-row flex-wrap items-center gap-2">
        <Text className="text-xl font-bold text-foreground" style={nepaliTextStyle(20)}>
          {t(`vastu.dir.${id}.name`)}
        </Text>
        <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: `${color}33` }}>
          <Text className="text-xs font-semibold" style={[nepaliTextStyle(12), { color }]}>
            {t(`vastu.element.${dir.element}`)}
          </Text>
        </View>
        <View
          className="rounded-full px-2.5 py-1"
          style={{ backgroundColor: dir.guna === "tamas" ? gunaColor : `${gunaColor}33` }}
        >
          <Text className="text-xs font-semibold" style={[nepaliTextStyle(12), { color: gunaFg }]}>
            {t(`vastu.wheel.organ.${dir.guna}`)}
          </Text>
        </View>
      </View>

      <Text className="mt-3 text-sm leading-6 text-foreground" style={nepaliTextStyle(13)}>
        {t(`vastu.dir.${id}.importance`)}
      </Text>

      <View className="mt-3 gap-2.5">
        {row(t("vastu.labels.deity"), t(`vastu.dir.${id}.deity`))}
        {dir.innerDeity
          ? row(t("vastu.labels.inner_deity"), t(`vastu.pada.${dir.innerDeity}.name`))
          : null}
        {row(t("vastu.labels.best"), t(`vastu.dir.${id}.best`))}
        {row(t("vastu.labels.avoid"), t(`vastu.dir.${id}.avoid`), true)}
      </View>
    </View>
  );
}

export default function VastuScreen() {
  const { t } = useLocale();
  const colors = useThemeColors();
  const { width, isTablet } = useBreakpoint();
  const [selected, setSelected] = useState<VastuDirectionId>("northeast");

  const wheelSize = Math.min(WHEEL_SIZE, width - (isTablet ? 80 : 62));

  return (
    <AppShell title="" showHeader={false}>
      <PatroPageHeader
        icon={<Ionicons name="compass-outline" size={28} color={colors.secondary} />}
        title={t("vastu.title")}
        subtitle={t("vastu.subtitle")}
      />

      <SectionCard icon="compass-outline" title={t("vastu.wheel.heading")} meta={t("vastu.wheel.hint")}>
        <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(13)}>
          {t("vastu.wheel.blurb")}
        </Text>

        <View className="items-center">
          <DirectionWheel size={wheelSize} selected={selected} onSelect={setSelected} />
        </View>

        <DirectionDetail id={selected} />

        <View className="flex-row flex-wrap gap-1.5">
          {VASTU_DIRECTIONS.map((dir) => {
            const active = dir.id === selected;
            const color = VASTU_ELEMENT_COLOR[dir.element];
            return (
              <Pressable
                key={dir.id}
                onPress={() => setSelected(dir.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5",
                  active ? "border-transparent" : "border-border",
                )}
                style={active ? { backgroundColor: `${color}2e` } : undefined}
              >
                <Text
                  className={cn(
                    "text-sm font-semibold",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                  style={nepaliTextStyle(13)}
                >
                  {t(`vastu.dir.${dir.id}.name`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SectionCard>

      <SectionCard
        icon="home-outline"
        title={t("vastu.rooms.heading")}
        meta={t("vastu.rooms.ideal")}
      >
        <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(13)}>
          {t("vastu.rooms.blurb")}
        </Text>

        {VASTU_ROOMS.map((room) => {
          const dir = vastuDirection(room.direction);
          const color = VASTU_ELEMENT_COLOR[dir.element];
          return (
            <View
              key={room.id}
              className="rounded-xl border border-border bg-card p-3"
              style={{ borderLeftWidth: 4, borderLeftColor: color }}
            >
              <View className="flex-row flex-wrap items-baseline gap-x-2">
                <Text className="font-semibold text-foreground" style={nepaliTextStyle(15)}>
                  {t(`vastu.room.${room.id}.name`)}
                </Text>
                <Text className="text-sm font-semibold" style={[nepaliTextStyle(13), { color }]}>
                  {t(`vastu.dir.${room.direction}.name`)}
                </Text>
              </View>
              <Text className="mt-1 text-sm text-muted-foreground" style={nepaliTextStyle(13)}>
                {t(`vastu.room.${room.id}.note`)}
              </Text>
            </View>
          );
        })}
      </SectionCard>

      <SectionCard icon="warning-outline" title={t("vastu.dosha.heading")}>
        <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(13)}>
          {t("vastu.dosha.blurb")}
        </Text>

        {VASTU_DOSHAS.map((id) => (
          <View key={id} className="rounded-xl border border-border bg-card p-3.5">
            <View className="flex-row items-start gap-2">
              <Ionicons name="warning-outline" size={16} color={colors.danger} style={{ marginTop: 3 }} />
              <Text className="min-w-0 flex-1 font-semibold text-foreground" style={nepaliTextStyle(14)}>
                {t(`vastu.dosha.${id}.problem`)}
              </Text>
            </View>
            <View className="mt-2 flex-row items-start gap-2">
              <Ionicons name="build-outline" size={16} color={colors.secondary} style={{ marginTop: 3 }} />
              <Text className="min-w-0 flex-1 text-sm text-muted-foreground" style={nepaliTextStyle(13)}>
                {t(`vastu.dosha.${id}.remedy`)}
              </Text>
            </View>
          </View>
        ))}
      </SectionCard>

      <View className="mb-2 rounded-xl border border-border bg-muted/40 p-3.5">
        <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(13)}>
          {t("vastu.note")}
        </Text>
      </View>
    </AppShell>
  );
}
