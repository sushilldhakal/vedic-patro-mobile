import { View } from "react-native";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { useLocale } from "@/lib/i18n";
import type { AstaStamp } from "@/lib/api";

export function StampLine({
  label,
  stamp,
}: {
  label: string;
  stamp: AstaStamp | null;
}) {
  const { digits } = useLocale();
  if (!stamp) {
    return (
      <Text className="text-xs text-muted-foreground">
        {label}: —
      </Text>
    );
  }
  const date = stamp.date_bs ?? stamp.date_ad ?? stamp.date ?? "";
  return (
    <Text className="text-sm text-foreground">
      <Text className="font-semibold">{label}: </Text>
      {digits(date)} · {digits(stamp.time_short)}
    </Text>
  );
}

export function GrahaPeriodCard({
  titleNe,
  titleEn,
  grahaNe,
  start,
  end,
  extraNe,
  extraEn,
}: {
  titleNe?: string;
  titleEn?: string;
  grahaNe: string;
  start: AstaStamp | null;
  end: AstaStamp | null;
  extraNe?: string;
  extraEn?: string;
}) {
  const { pick } = useLocale();
  return (
    <Card className="mb-2 gap-1 p-3">
      {titleNe ? (
        <Text className="text-xs font-bold uppercase text-muted-foreground">
          {pick(titleNe, titleEn ?? titleNe)}
        </Text>
      ) : null}
      <Text className="text-base font-semibold text-foreground">{grahaNe}</Text>
      <StampLine label={pick("सुरु", "Start")} stamp={start} />
      <StampLine label={pick("अन्त", "End")} stamp={end} />
      {extraNe ? (
        <Text className="text-xs text-muted-foreground">{pick(extraNe, extraEn ?? extraNe)}</Text>
      ) : null}
    </Card>
  );
}

export function SimpleEventCard({
  title,
  subtitle,
  body,
}: {
  title: string;
  subtitle?: string;
  body?: string;
}) {
  return (
    <Card className="mb-2 gap-1 p-3">
      <Text className="text-base font-semibold text-foreground">{title}</Text>
      {subtitle ? <Text className="text-sm text-muted-foreground">{subtitle}</Text> : null}
      {body ? <Text className="text-sm text-foreground">{body}</Text> : null}
    </Card>
  );
}

export function EmptyHint({ ne, en }: { ne: string; en: string }) {
  const { pick } = useLocale();
  return (
    <View className="py-8">
      <Text className="text-center text-sm text-muted-foreground">{pick(ne, en)}</Text>
    </View>
  );
}
