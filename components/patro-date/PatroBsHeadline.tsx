import type { ReactNode } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/Text";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { useThemeColors } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

type Props = {
  /** Vikram year + era (month stays on the left chip). */
  bs: ReactNode;
  samvatsara?: ReactNode;
  gregorian?: ReactNode;
  className?: string;
  /** Phone title row vs tablet headline. */
  compact?: boolean;
};

/**
 * Same structure as web {@link BsHeadline}: one flex row, baseline-aligned.
 * `२०८३ वि.सं.  रौद्र  जुल/अग २०२६` on one line when width allows.
 */
export function PatroBsHeadline({ bs, samvatsara, gregorian, className, compact = false }: Props) {
  const colors = useThemeColors();
  const bsSize = compact ? 14 : 20;
  const samSize = compact ? 14 : 20;
  const gregSize = compact ? 12 : 16;
  const secondary = { color: colors.secondary };
  const muted = { color: colors.mutedForeground };

  return (
    <View
      className={cn("min-w-0 flex-row flex-wrap items-center gap-x-1.5 gap-y-0.5 pt-1 sm:pt-0", className)}
    >
      {typeof bs === "string" ? (
        <Text
          className="min-w-0 font-semibold text-secondary"
          style={[nepaliTextStyle(bsSize), secondary]}
        >
          {bs}
        </Text>
      ) : (
        <View className="shrink-0 flex-row flex-wrap items-center gap-x-1">{bs}</View>
      )}
      {samvatsara ? (
        <Text
          className="shrink-0 font-semibold text-secondary"
          style={[nepaliTextStyle(samSize), secondary]}
        >
          {samvatsara}
        </Text>
      ) : null}
      {gregorian ? (
        <Text
          numberOfLines={2}
          className="min-w-0 shrink font-semibold text-muted-foreground"
          style={[nepaliTextStyle(gregSize), muted]}
        >
          {gregorian}
        </Text>
      ) : null}
    </View>
  );
}
