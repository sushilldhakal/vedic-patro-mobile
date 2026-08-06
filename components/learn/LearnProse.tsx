import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "@/components/ui/Text";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";

export function LearnSection({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { lang } = useLocale();
  return (
    <View className="mb-8 gap-3">
      <View className="gap-1 border-b border-border pb-2">
        <Text className="font-num text-xs font-bold uppercase tracking-wider text-secondary">
          {kicker}
        </Text>
        <Text className="text-lg font-bold text-foreground" style={nepaliTextStyle(18)}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-sm text-muted-foreground" style={lang === "en" ? undefined : nepaliTextStyle(14)}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function LearnLede({ children }: { children: ReactNode }) {
  const { lang } = useLocale();
  return (
    <Text className="text-base leading-relaxed text-foreground" style={nepaliTextStyle(16)}>
      {children}
    </Text>
  );
}

export function LearnNote({ children }: { children: ReactNode }) {
  return (
    <View className="rounded-xl border border-border bg-muted/30 px-3 py-3">
      <Text className="text-sm leading-relaxed text-muted-foreground" style={nepaliTextStyle(14)}>
        {children}
      </Text>
    </View>
  );
}

export function LearnKeys({ items }: { items: { title: string; body: string }[] }) {
  const { lang } = useLocale();
  return (
    <View className="gap-2">
      {items.map((item) => (
        <View key={item.title} className="rounded-lg border border-border bg-card px-3 py-2.5">
          <Text className="text-sm font-bold text-foreground" style={nepaliTextStyle(14)}>
            {item.title}
          </Text>
          <Text className="mt-1 text-sm leading-snug text-muted-foreground" style={nepaliTextStyle(13)}>
            {item.body}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function LearnFormulaRow({ items }: { items: { value: string; label: string; desc: string }[] }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {items.map((item) => (
        <View key={item.label} className="min-w-[44%] flex-1 rounded-xl border border-border bg-card p-3">
          <Text className="font-num text-xl font-bold text-secondary">{item.value}</Text>
          <Text className="mt-1 text-xs font-bold uppercase tracking-wide text-foreground">{item.label}</Text>
          <Text className="mt-1 text-xs leading-snug text-muted-foreground" style={nepaliTextStyle(11)}>
            {item.desc}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** In-app link to another learn article or app route — never opens the website. */
export function LearnLink({
  slug,
  href,
  children,
}: {
  slug?: string;
  href?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const path = slug ? `/learn/${slug}` : href;
  if (!path) return <Text>{children}</Text>;
  return (
    <Pressable
      onPress={() => router.push(path as never)}
      accessibilityRole="link"
      className="active:opacity-80"
    >
      <Text className="font-semibold text-secondary underline" style={nepaliTextStyle(16)}>
        {children}
      </Text>
    </Pressable>
  );
}

export function LearnAppRouteLink({ href, children }: { href: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push(href as never)} className="mt-2 active:opacity-80">
      <Text className="text-sm font-semibold text-primary" style={nepaliTextStyle(14)}>
        {children} →
      </Text>
    </Pressable>
  );
}
