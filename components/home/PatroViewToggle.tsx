import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type HomePatroView = "calendar" | "panchanga";

type Props = {
  value: HomePatroView;
  onChange: (view: HomePatroView) => void;
  compact?: boolean;
};

export function PatroViewToggle({ value, onChange, compact }: Props) {
  const { pick } = useLocale();

  if (compact) {
    const next = value === "calendar" ? "panchanga" : "calendar";
    return (
      <Pressable
        onPress={() => onChange(next)}
        className="flex-row items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-2 active:bg-muted"
      >
        <Ionicons name="swap-horizontal" size={16} color="#0b565a" />
        <Text className="text-xs font-semibold text-secondary">
          {value === "calendar"
            ? pick("पञ्चाङ्ग पात्रो", "Panchanga Patro")
            : pick("वि.सं. पात्रो", "BS Calendar")}
        </Text>
      </Pressable>
    );
  }

  return (
    <View className="flex-row overflow-hidden rounded-lg border border-border bg-card p-0.5">
      {(
        [
          { id: "calendar" as const, ne: "वि.सं. पात्रो", en: "BS Calendar" },
          { id: "panchanga" as const, ne: "पञ्चाङ्ग पात्रो", en: "Panchanga Patro" },
        ] as const
      ).map((item) => (
        <Pressable
          key={item.id}
          onPress={() => onChange(item.id)}
          className={cn(
            "rounded-md px-3 py-2",
            value === item.id ? "bg-secondary" : "bg-transparent",
          )}
        >
          <Text
            className={cn(
              "text-xs font-semibold",
              value === item.id ? "text-secondary-foreground" : "text-muted-foreground",
            )}
          >
            {pick(item.ne, item.en)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
