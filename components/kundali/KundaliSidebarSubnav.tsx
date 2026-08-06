import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/Text";
import {
  KUNDALI_SECTIONS,
  kundaliSectionLabel,
  type KundaliSectionId,
} from "@/lib/kundali/kundali-section-nav";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { colorWithAlpha } from "@/lib/theme";
import { useThemeColors } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

/** Section tabs nested under जन्मकुण्डली — mirrors web `KundaliSidebarSubnav`. */
export function KundaliSidebarSubnav({
  activeSectionId,
  onNavigate,
}: {
  activeSectionId: KundaliSectionId;
  onNavigate: (id: KundaliSectionId) => void;
}) {
  const { lang, pick } = useLocale();
  const colors = useThemeColors();

  return (
    <View className="ml-2 gap-0.5 border-l border-border/70 py-1 pl-2">
      {KUNDALI_SECTIONS.map((section) => {
        const { id, ...rest } = section;
        const isChild = "parentId" in rest && rest.parentId != null;
        const active = activeSectionId === id;
        return (
          <Pressable
            key={id}
            onPress={() => onNavigate(id)}
            className={cn("rounded-lg py-1.5", isChild ? "pl-3 pr-2" : "px-2")}
            style={
              active
                ? {
                    backgroundColor: colorWithAlpha(colors.secondary, 0.12),
                    borderWidth: 1,
                    borderColor: colorWithAlpha(colors.secondary, 0.2),
                  }
                : undefined
            }
          >
            <Text
              className={cn(
                "text-xs leading-snug",
                active ? "font-semibold text-secondary" : "text-muted-foreground",
              )}
              style={nepaliTextStyle(12)}
            >
              {kundaliSectionLabel(section, lang)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
