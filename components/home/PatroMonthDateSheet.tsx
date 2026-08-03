import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SelectOption } from "@/components/ui/BsNativeSelect";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import type { MonthBrowseEra } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import type { PanchangaLocation } from "@/lib/use-panchanga-location";
import { useThemeColors } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  month: number;
  year: number;
  browseEra: MonthBrowseEra;
  monthOptions: SelectOption[];
  yearOptions: SelectOption[];
  location: PanchangaLocation;
  onLocationChange: (location: PanchangaLocation) => void;
  onCommit: (month: number, year: number, era: MonthBrowseEra) => void;
};

type SheetTab = "date" | "location";

/** Month grid + year dropdown + BS/BBS — mirrors web PatroDateSheet (date + location). */
export function PatroMonthDateSheet({
  open,
  onClose,
  month,
  year,
  browseEra,
  monthOptions,
  yearOptions,
  location,
  onLocationChange,
  onCommit,
}: Props) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { pick, lang } = useLocale();
  const [tab, setTab] = useState<SheetTab>("date");
  const [draftMonth, setDraftMonth] = useState(month);
  const [draftYear, setDraftYear] = useState(year);
  const [draftEra, setDraftEra] = useState<MonthBrowseEra>(browseEra);

  useEffect(() => {
    if (open) {
      setDraftMonth(month);
      setDraftYear(year);
      setDraftEra(browseEra);
      setTab("date");
    }
  }, [open, month, year, browseEra]);

  const title =
    tab === "date" ? pick("महिना / वर्ष", "Month / year") : pick("स्थान", "Location");

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            paddingBottom: Math.max(insets.bottom, 12),
            maxHeight: "85%",
          }}
        >
          <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
            <Pressable onPress={onClose} hitSlop={8}>
              <Text className="text-base text-muted-foreground">{pick("रद्द", "Cancel")}</Text>
            </Pressable>
            <Text
              className="text-base font-semibold text-foreground"
              style={lang === "en" ? undefined : nepaliTextStyle(16)}
            >
              {title}
            </Text>
            <Pressable
              onPress={() => {
                onCommit(draftMonth, draftYear, draftEra);
                onClose();
              }}
              hitSlop={8}
            >
              <Text className="text-base font-semibold text-primary">{pick("भयो", "Done")}</Text>
            </Pressable>
          </View>

          <View className="mx-4 mt-3 flex-row rounded-lg border border-border bg-muted/30 p-0.5">
            <Pressable
              onPress={() => setTab("date")}
              className={cn(
                "flex-1 items-center rounded-md py-2",
                tab === "date" ? "bg-card" : "",
              )}
            >
              <Text className="text-sm font-semibold text-foreground">{pick("मिति", "Date")}</Text>
            </Pressable>
            <Pressable
              onPress={() => setTab("location")}
              className={cn(
                "flex-1 items-center rounded-md py-2",
                tab === "location" ? "bg-card" : "",
              )}
            >
              <Text className="text-sm font-semibold text-foreground">{pick("स्थान", "Location")}</Text>
            </Pressable>
          </View>

          {tab === "date" ? (
            <ScrollView keyboardShouldPersistTaps="handled">
              <View className="mx-4 mt-3 flex-row gap-2">
                {(["bs", "bbs"] as const).map((era) => (
                  <Pressable
                    key={era}
                    onPress={() => setDraftEra(era)}
                    className={cn(
                      "flex-1 items-center rounded-lg border py-2",
                      draftEra === era
                        ? "border-secondary bg-secondary"
                        : "border-border bg-card",
                    )}
                  >
                    <Text
                      className={cn(
                        "text-sm font-bold",
                        draftEra === era ? "text-secondary-foreground" : "text-foreground",
                      )}
                    >
                      {era === "bs" ? pick("वि.सं.", "B.S.") : pick("बि.सं.", "B.B.S.")}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View className="flex-row flex-wrap gap-2 px-4 py-4">
                {monthOptions.map((option) => {
                  const selected = option.value === draftMonth;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setDraftMonth(option.value)}
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

              <View className="mx-4 mb-4 overflow-hidden rounded-lg border border-border bg-card">
                <Text className="border-b border-border px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {pick("वर्ष", "Year")}
                </Text>
                {Platform.OS === "web" ? (
                  <select
                    value={draftYear}
                    onChange={(e) => setDraftYear(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: 12,
                      fontSize: 16,
                      border: "none",
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
                    selectedValue={draftYear}
                    onValueChange={(v) => setDraftYear(Number(v))}
                    style={{ height: Platform.OS === "ios" ? 180 : 48 }}
                  >
                    {yearOptions.map((o) => (
                      <Picker.Item key={o.value} label={o.label} value={o.value} color={colors.foreground} />
                    ))}
                  </Picker>
                )}
              </View>
            </ScrollView>
          ) : (
            <View className="px-4 py-4">
              <LocationSelector location={location} onLocationChange={onLocationChange} />
              <Text className="mt-3 text-center text-xs text-muted-foreground">
                {pick(
                  "स्थान परिवर्तन तुरुन्त लागू हुन्छ।",
                  "Location changes apply immediately.",
                )}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
