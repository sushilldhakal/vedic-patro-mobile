import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/Text";
import { useLocale } from "@/lib/i18n";
import { useBreakpoint } from "@/lib/responsive";
import { cn } from "@/lib/utils";
import { nepaliTextStyle } from "@/lib/nepali-text";

export type DayCycleMode = "Day-Night" | "Calendar Day";

type Props = {
  mode: DayCycleMode;
  onModeChange?: (mode: DayCycleMode) => void;
  size?: "sm" | "md";
};

const OPTIONS: Array<{ value: DayCycleMode; ne: string; en: string }> = [
  { value: "Day-Night", ne: "अहोरात्र", en: "Day-Night" },
  { value: "Calendar Day", ne: "दिन-रात", en: "Calendar Day" },
];

/** Match web DayTimeline toggle — inactive mode on phone, segmented on md+. */
export function DayCycleToggle({ mode, onModeChange, size = "md" }: Props) {
  const { pick } = useLocale();
  const { isCompact } = useBreakpoint();
  const inactive = OPTIONS.find((o) => o.value !== mode) ?? OPTIONS[0]!;
  const pad = size === "md" ? "px-3.5 py-1.5" : "px-2 py-0.5";

  if (isCompact) {
    return (
      <Pressable
        onPress={() => onModeChange?.(inactive.value)}
        className={cn(
          "h-[30px] items-center justify-center rounded-lg border border-border bg-card px-3 active:bg-muted",
          pad,
        )}
        accessibilityLabel={pick(`${inactive.ne} मा बदल्नुहोस्`, `Switch to ${inactive.en}`)}
      >
        <Text className="text-sm font-semibold text-foreground" style={nepaliTextStyle(14)}>
          {pick(inactive.ne, inactive.en)}
        </Text>
      </Pressable>
    );
  }

  return (
    <View className="h-8 flex-row overflow-hidden rounded-lg border border-border">
      {OPTIONS.map((o) => {
        const active = mode === o.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onModeChange?.(o.value)}
            className={cn(
              "min-w-[5.5rem] flex-1 items-center justify-center px-2",
              active ? "bg-primary" : "bg-card active:bg-muted",
            )}
          >
            <Text
              className={cn("text-sm font-semibold", active ? "text-primary-foreground" : "text-foreground")}
              style={nepaliTextStyle(14)}
            >
              {pick(o.ne, o.en)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
