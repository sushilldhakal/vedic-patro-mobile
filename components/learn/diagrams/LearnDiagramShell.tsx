import type { ReactNode } from "react";
import { View } from "react-native";
import Slider from "@react-native-community/slider";
import { Text } from "@/components/ui/Text";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { useThemeColors } from "@/lib/theme-context";

type Props = {
  title?: string;
  caption?: string;
  height?: number;
  children: ReactNode;
  sliderValue?: number;
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
  onSliderChange?: (v: number) => void;
  sliderLabel?: string;
};

export function LearnDiagramShell({
  title,
  caption,
  height = 240,
  children,
  sliderValue,
  sliderMin = 0,
  sliderMax = 365,
  sliderStep = 1,
  onSliderChange,
  sliderLabel,
}: Props) {
  const { pick } = useLocale();
  const colors = useThemeColors();

  return (
    <View className="my-3 overflow-hidden rounded-xl border border-border bg-muted/20">
      {title ? (
        <Text
          className="border-b border-border/60 px-3 py-2 text-xs font-bold uppercase tracking-wide text-secondary"
          style={nepaliTextStyle(11)}
        >
          {title}
        </Text>
      ) : null}
      <View style={{ height, width: "100%" }}>{children}</View>
      {onSliderChange != null && sliderValue != null ? (
        <View className="border-t border-border/60 px-3 py-2">
          {sliderLabel ? (
            <Text className="mb-1 text-[11px] font-semibold text-foreground" style={nepaliTextStyle(11)}>
              {sliderLabel}
            </Text>
          ) : null}
          <Slider
            value={sliderValue}
            minimumValue={sliderMin}
            maximumValue={sliderMax}
            step={sliderStep}
            onValueChange={onSliderChange}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <Text className="text-center text-[10px] text-muted-foreground">
            {pick("स्लाइडर तान्नुहोस्", "Drag the slider")}
          </Text>
        </View>
      ) : null}
      {caption ? (
        <Text
          className="border-t border-border/60 px-3 py-2 text-xs leading-snug text-muted-foreground"
          style={nepaliTextStyle(12)}
        >
          {caption}
        </Text>
      ) : null}
    </View>
  );
}
