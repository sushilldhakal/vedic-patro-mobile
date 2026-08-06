import { useMemo } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/Text";
import { BsNativeSelect } from "@/components/ui/BsNativeSelect";
import { getBSMonthLength } from "@/lib/bs-calendar";
import { useLocale } from "@/lib/i18n";
import { formatClockParts, parseClockParts } from "@/components/panchanga/use-panchanga-mode";

type Props = {
  year: number;
  month: number;
  day: number;
  clock: string;
  showTime: boolean;
  onDayChange: (day: number) => void;
  onClockChange: (clock: string) => void;
};

/** Day + time rows — matches web {@link PatroMobileDateSheetDraft} mobile sheet. */
export function PatroSheetDayTimeFields({
  year,
  month,
  day,
  clock,
  showTime,
  onDayChange,
  onClockChange,
}: Props) {
  const { pick, digits } = useLocale();

  const dayOptions = useMemo(() => {
    const len = getBSMonthLength(year, month);
    return Array.from({ length: len }, (_, i) => ({
      value: i + 1,
      label: digits(i + 1),
    }));
  }, [year, month, digits]);

  const { hour, minute } = parseClockParts(clock || "00:00");

  const hourOptions = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        value: i,
        label: digits(String(i).padStart(2, "0")),
      })),
    [digits],
  );

  const minuteOptions = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        value: i,
        label: digits(String(i).padStart(2, "0")),
      })),
    [digits],
  );

  return (
    <View className="gap-3 pt-1">
      <View className="flex-row items-center justify-center gap-2">
        <Text className="text-sm font-semibold text-muted-foreground">{pick("गते", "Day")}</Text>
        <BsNativeSelect
          value={day}
          options={dayOptions}
          ariaLabel={pick("गते", "Day")}
          onChange={onDayChange}
          minWidth={80}
        />
      </View>

      {showTime ? (
        <View className="gap-2">
          <Text className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {pick("समय", "Time")}
          </Text>
          <View className="flex-row items-center justify-center gap-2">
            <BsNativeSelect
              value={hour}
              options={hourOptions}
              ariaLabel={pick("घण्टा", "Hour")}
              onChange={(h) => onClockChange(formatClockParts(h, minute))}
              minWidth={72}
            />
            <Text className="font-num text-base font-semibold text-muted-foreground">:</Text>
            <BsNativeSelect
              value={minute}
              options={minuteOptions}
              ariaLabel={pick("मिनेट", "Minute")}
              onChange={(m) => onClockChange(formatClockParts(hour, m))}
              minWidth={72}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}
