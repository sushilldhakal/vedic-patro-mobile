import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/Text";
import type { SelectOption } from "@/components/ui/BsNativeSelect";
import { BsDateTimePicker } from "@/components/panchanga/BsDateTimePicker";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { windowedBrowseYears } from "@/lib/patro-browse-years";
import type { PatroBrowseEra } from "@/lib/patro-era";
import { cn } from "@/lib/utils";
import type { PatroDateNavMode } from "./types";
import { PatroYearSheetStepper } from "./PatroYearSheetStepper";

export type PatroDateSheetDraft = {
  era: PatroBrowseEra;
  year: number;
  month: number;
  day: number;
  clock: string;
};

type Props = {
  mode: PatroDateNavMode;
  draft: PatroDateSheetDraft;
  onDraftChange: (patch: Partial<PatroDateSheetDraft>) => void;
  monthOptions: SelectOption[];
  todayAd?: string;
  showTime: boolean;
  onYearTypingPreviewChange?: (preview: string | null) => void;
  onYearInputFocus?: () => void;
};

export function PatroDateSheetDatePanel({
  mode,
  draft,
  onDraftChange,
  monthOptions,
  todayAd,
  showTime,
  onYearTypingPreviewChange,
  onYearInputFocus,
}: Props) {
  const { pick, lang } = useLocale();
  const yearOptions = windowedBrowseYears(draft.era, draft.year);

  const yearStepperProps = {
    era: draft.era,
    year: draft.year,
    onEraChange: (era: PatroBrowseEra) => onDraftChange({ era }),
    onYearChange: (year: number) => onDraftChange({ year }),
    onYearTypingPreviewChange,
    onYearInputFocus,
  };

  if (mode === "year-month-time") {
    return (
      <View>
        <View className="mx-4 mt-2 mb-2">
          <PatroYearSheetStepper {...yearStepperProps} />
        </View>
        <BsDateTimePicker
          key={`${draft.era}-${draft.year}-${draft.month}-${draft.day}-${draft.clock}`}
          year={draft.year}
          month={draft.month}
          day={draft.day}
          yearOptions={yearOptions}
          todayAd={todayAd}
          onSelectDate={(y, m, d) => onDraftChange({ year: y, month: m, day: d })}
          monthAriaLabel={pick("महिना", "Month")}
          yearAriaLabel={pick("वर्ष", "Year")}
          clock={draft.clock}
          onClockChange={(clock) => onDraftChange({ clock })}
          hourAriaLabel={pick("घण्टा", "Hour")}
          minuteAriaLabel={pick("मिनेट", "Minute")}
          showTime={showTime}
          onDone={() => {}}
        />
      </View>
    );
  }

  return (
    <View>
      {mode === "year-month" ? (
        <View className="gap-2 px-4 py-4">
          <View className="flex-row flex-wrap gap-2">
            {monthOptions.map((option) => {
              const selected = option.value === draft.month;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => onDraftChange({ month: option.value })}
                  className={cn(
                    "min-w-[30%] flex-1 items-center rounded-lg border px-2 py-2.5",
                    selected ? "border-secondary bg-secondary" : "border-border bg-card active:bg-muted",
                  )}
                  style={{ maxWidth: "32%" }}
                >
                  <Text
                    numberOfLines={1}
                    className={cn(
                      "text-sm font-semibold",
                      selected ? "text-secondary-foreground" : "text-foreground",
                    )}
                    style={[
                      { textAlign: "center", width: "100%" },
                      lang === "en" ? undefined : nepaliTextStyle(14),
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <PatroYearSheetStepper {...yearStepperProps} />
        </View>
      ) : (
        <View className="px-4 py-4">
          <PatroYearSheetStepper {...yearStepperProps} />
        </View>
      )}
    </View>
  );
}
