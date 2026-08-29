import { View } from "react-native";
import { Text } from "@/components/ui/Text";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";

/**
 * Stand-in for a diagram id that doesn't have a native 3D scene yet.
 *
 * Swapped for a real scene in `lib/learn/learn-diagrams.tsx` as each one lands
 * (Learn port Phase 3) — never a permanent destination for any id.
 */
export function DiagramPlaceholder() {
  const { pick } = useLocale();
  return (
    <View className="items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10">
      <Text className="text-center text-sm text-muted-foreground" style={nepaliTextStyle(13)}>
        {pick("यो चित्र चाँडै आउँदैछ", "This diagram is coming soon")}
      </Text>
    </View>
  );
}
