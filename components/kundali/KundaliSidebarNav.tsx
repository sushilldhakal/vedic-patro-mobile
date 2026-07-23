import { Pressable, Text, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { cn } from "@/lib/utils";
import {
  isKundaliSidebarItemActive,
  KUNDALI_SIDEBAR_SECTIONS,
  type KundaliSidebarItem,
} from "@/lib/kundali/kundali-sidebar-nav";

function SidebarLink({
  item,
  active,
  onPress,
}: {
  item: KundaliSidebarItem;
  active: boolean;
  onPress: () => void;
}) {
  const { pick } = useLocale();
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "rounded-lg px-3 py-2.5",
        active ? "bg-secondary/10" : "active:bg-muted",
      )}
    >
      <Text
        className={cn("text-sm", active ? "font-semibold text-secondary" : "text-foreground")}
        style={nepaliTextStyle(14)}
      >
        {pick(item.labelNe, item.labelEn)}
      </Text>
    </Pressable>
  );
}

export function KundaliSidebarNav({ className }: { className?: string }) {
  const { pick } = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View className={cn("w-56 shrink-0 gap-4", className)}>
      {KUNDALI_SIDEBAR_SECTIONS.map((section) => (
        <View key={section.id} className="gap-1">
          <Text
            className="px-3 pb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground"
            style={nepaliTextStyle(12)}
          >
            {pick(section.titleNe, section.titleEn)}
          </Text>
          {section.items.map((item) => (
            <SidebarLink
              key={item.id}
              item={item}
              active={isKundaliSidebarItemActive(pathname, item)}
              onPress={() => router.push(item.href as never)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
