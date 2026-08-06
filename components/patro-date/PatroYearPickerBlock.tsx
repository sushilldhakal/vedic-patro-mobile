import { Platform, Pressable, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import {
  browseYearSelectOptions,
  clampBrowseYear,
  maxBrowseYearForEra,
} from "@/lib/patro-browse-years";
import { toggleBrowseEraForLang, type PatroBrowseEra } from "@/lib/patro-era";
import { useThemeColors } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { usePatroEraLabels } from "./patro-era-labels";

type Props = {
  era: PatroBrowseEra;
  year: number;
  onEraChange: (era: PatroBrowseEra) => void;
  onYearChange: (year: number) => void;
  /** Wider controls for tablet / sheet (web “comfortable”). */
  comfortable?: boolean;
};

export function PatroYearPickerBlock({
  era,
  year,
  onEraChange,
  onYearChange,
  comfortable = false,
}: Props) {
  const colors = useThemeColors();
  const { pick, lang, digits } = useLocale();
  const labels = usePatroEraLabels(era);
  const yearOptions = browseYearSelectOptions(era, year, digits);
  const yearMin = 1;
  const yearMax = maxBrowseYearForEra(era);
  const clamped = clampBrowseYear(era, year);

  const switchEra = () => {
    const next = toggleBrowseEraForLang(era, lang);
    onEraChange(next);
    onYearChange(clampBrowseYear(next, year));
  };

  const stepYear = (delta: -1 | 1) => {
    onYearChange(clampBrowseYear(era, clamped + delta));
  };

  const btnSize = comfortable ? 36 : 32;
  const numSize = comfortable ? 20 : 18;

  return (
    <View className="overflow-hidden rounded-lg border border-border bg-card">
      <Text
        className="border-b border-border px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        style={lang === "en" ? undefined : nepaliTextStyle(11)}
      >
        {labels.yearSection}
      </Text>

      <Pressable
        onPress={switchEra}
        className="mx-2 mt-2 flex-row items-center justify-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-2 active:bg-muted"
      >
        <Ionicons name="swap-horizontal" size={14} color={colors.mutedForeground} />
        <Text
          className="text-xs font-semibold text-muted-foreground"
          style={lang === "en" ? undefined : nepaliTextStyle(12)}
        >
          {labels.toggle}
        </Text>
      </Pressable>

      <View className="flex-row items-center justify-center gap-2 px-2 py-2">
        <Pressable
          onPress={() => stepYear(-1)}
          disabled={clamped <= yearMin}
          className={cn(
            "items-center justify-center rounded-lg border border-border bg-card active:bg-muted",
            clamped <= yearMin && "opacity-40",
          )}
          style={{ width: btnSize, height: btnSize }}
        >
          <Ionicons name="remove" size={comfortable ? 20 : 18} color={colors.foreground} />
        </Pressable>

        <View className="min-w-[5rem] items-center">
          <Text className="font-num font-bold text-foreground" style={{ fontSize: numSize }}>
            {digits(clamped)}
          </Text>
        </View>

        <Pressable
          onPress={() => stepYear(1)}
          disabled={clamped >= yearMax}
          className={cn(
            "items-center justify-center rounded-lg border border-border bg-card active:bg-muted",
            clamped >= yearMax && "opacity-40",
          )}
          style={{ width: btnSize, height: btnSize }}
        >
          <Ionicons name="add" size={comfortable ? 20 : 18} color={colors.foreground} />
        </Pressable>
      </View>

      {Platform.OS === "web" ? (
        <select
          value={clamped}
          onChange={(e) => onYearChange(clampBrowseYear(era, Number(e.target.value)))}
          style={{
            width: "100%",
            padding: 12,
            fontSize: 16,
            border: "none",
            borderTop: `1px solid ${colors.border}`,
            background: colors.card,
            color: colors.foreground,
          }}
        >
          {yearOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <Picker
          selectedValue={clamped}
          onValueChange={(v) => onYearChange(clampBrowseYear(era, Number(v)))}
          style={{ height: Platform.OS === "ios" ? (comfortable ? 200 : 180) : 48 }}
        >
          {yearOptions.map((o) => (
            <Picker.Item key={o.value} label={o.label} value={o.value} color={colors.foreground} />
          ))}
        </Picker>
      )}
    </View>
  );
}
