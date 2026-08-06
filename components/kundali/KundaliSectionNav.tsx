import { Pressable, ScrollView, Text, View } from "react-native";
import {
  KUNDALI_SECTIONS,
  kundaliSectionLabel,
  type KundaliSectionId,
} from "@/lib/kundali/kundali-section-nav";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { useThemeColors } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

type Props = {
  activeId: KundaliSectionId;
  onNavigate: (id: KundaliSectionId) => void;
  variant?: "sidebar" | "horizontal";
  className?: string;
};

export function KundaliSectionNav({
  activeId,
  onNavigate,
  variant = "horizontal",
  className,
}: Props) {
  const { lang, pick } = useLocale();
  const colors = useThemeColors();

  if (variant === "sidebar") {
    return (
      <View className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
        <Text
          className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          style={nepaliTextStyle(12)}
        >
          {pick("कुण्डली खण्ड", "Chart sections")}
        </Text>
        <View className="gap-1 p-2">
          {KUNDALI_SECTIONS.map((section) => {
            const { id, ...rest } = section;
            const active = activeId === id;
            const isChild = "parentId" in rest && rest.parentId != null;
            return (
              <Pressable
                key={id}
                onPress={() => onNavigate(id)}
                className={cn(
                  "rounded-xl py-2.5",
                  isChild ? "pl-8 pr-3" : "px-3",
                  active ? "bg-secondary/12" : "active:bg-muted",
                )}
                style={active ? { borderWidth: 1, borderColor: `${colors.secondary}40` } : undefined}
              >
                <Text
                  className={cn("text-sm", active ? "font-semibold text-secondary" : "text-foreground")}
                  style={nepaliTextStyle(14)}
                >
                  {kundaliSectionLabel(section, lang)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className={cn("mb-4 max-h-12", className)}
      contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
    >
      {KUNDALI_SECTIONS.map((section) => {
        const { id, ...rest } = section;
        const active = activeId === id;
        const isChild = "parentId" in rest && rest.parentId != null;
        return (
          <Pressable
            key={id}
            onPress={() => onNavigate(id)}
            style={{
              backgroundColor: active ? `${colors.secondary}18` : colors.card,
              borderColor: active ? `${colors.secondary}66` : colors.border,
            }}
            className={cn(
              "rounded-full border px-3 py-1.5 active:opacity-80",
              isChild && "ml-1 border-dashed",
            )}
          >
            <Text
              className={cn("text-xs whitespace-nowrap", active ? "font-semibold text-secondary" : "text-foreground")}
              style={nepaliTextStyle(12)}
            >
              {kundaliSectionLabel(section, lang)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
