import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { useThemeColors } from "@/lib/theme-context";

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  titleNe: string;
  titleEn: string;
  bodyNe: string;
  bodyEn: string;
  onLogin: () => void;
  onSignup: () => void;
};

export function KundaliLoginPrompt({
  icon = "sparkles-outline",
  titleNe,
  titleEn,
  bodyNe,
  bodyEn,
  onLogin,
  onSignup,
}: Props) {
  const { pick } = useLocale();
  const colors = useThemeColors();

  return (
    <View className="items-center rounded-2xl border border-border bg-card px-6 py-12">
      <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-secondary/15">
        <Ionicons name={icon} size={28} color={colors.secondary} />
      </View>
      <Text className="text-center text-xl font-bold text-foreground" style={nepaliTextStyle(20)}>
        {pick(titleNe, titleEn)}
      </Text>
      <Text
        className="mt-2 max-w-md text-center text-sm text-muted-foreground"
        style={nepaliTextStyle(14)}
      >
        {pick(bodyNe, bodyEn)}
      </Text>
      <View className="mt-6 flex-row flex-wrap items-center justify-center gap-3">
        <Button label={pick("लगइन", "Log in")} size="lg" onPress={onLogin} />
        <Button label={pick("साइन अप", "Sign up")} size="lg" variant="outline" onPress={onSignup} />
      </View>
    </View>
  );
}
