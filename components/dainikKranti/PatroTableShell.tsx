import { type ReactNode } from "react";
import { ScrollView, View } from "react-native"
import { Text } from "@/components/ui/Text"
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

type Props = {
  titleNe: string;
  titleEn?: string;
  subtitle?: string;
  subtitleEn?: string;
  children: ReactNode;
  className?: string;
};

export function PatroTableShell({ titleNe, titleEn, subtitle, subtitleEn, children, className }: Props) {
  const { lang, pick } = useLocale();
  return (
    <View className={cn("overflow-hidden rounded-xl border border-border", className)}>
      <View className="border-b border-border px-4 py-3">
        <Text className="text-sm font-semibold text-foreground">{pick(titleNe, titleEn ?? titleNe)}</Text>
        {titleEn && lang === "ne" ? <Text className="mt-0.5 text-sm text-muted-foreground">{titleEn}</Text> : null}
        {subtitle ? (
          <Text className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {pick(subtitle, subtitleEn ?? subtitle)}
          </Text>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator className="max-w-full">
        {children}
      </ScrollView>
    </View>
  );
}
