import { useEffect, useMemo, useState } from "react";
import { View } from "react-native"
import { Text } from "@/components/ui/Text"
import { Ionicons } from "@expo/vector-icons";
import { getZonedTimeParts, minutesSinceMidnightInTimezone } from "@/lib/zoned-time";
import { useLocale } from "@/lib/i18n";

function parseTimeToMinutes(time?: string): number | null {
  if (!time) return null;
  const m = time.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

type Props = {
  sunrise?: string;
  sunset?: string;
  timezone?: string;
};

export function GhatiClock({ sunrise, sunset, timezone }: Props) {
  const { pick, digits } = useLocale();
  const [now, setNow] = useState(() => new Date());
  const timeZone = timezone || "Asia/Kathmandu";

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 200);
    return () => clearInterval(id);
  }, []);

  const { hour: hh, minute: mm, second: ss } = useMemo(
    () => getZonedTimeParts(now, timeZone),
    [now, timeZone],
  );

  const sunriseMin = parseTimeToMinutes(sunrise) ?? 5 * 60 + 12;
  const minsNow = minutesSinceMidnightInTimezone(now, timeZone, true);
  let vg = (minsNow - sunriseMin) / 24;
  if (vg < 0) vg += 60;
  const gh = Math.floor(vg);
  const pa = Math.floor((vg - gh) * 60);
  const vi = Math.floor(((vg - gh) * 60 - pa) * 60);

  return (
    <View className="relative overflow-hidden rounded-xl bg-[#07080d] px-4 pb-4 pt-5 text-center shadow-lg">
      <Text className="text-sm font-semibold tracking-[0.16em] text-[#f5f5f1]/55">
        {pick("वैदिक समय", "Vedic time")}
      </Text>
      <Text className="mt-3.5 font-mono text-5xl font-bold leading-none tracking-tight text-[#f5f5f1]">
        {digits(pad2(gh))}
        <Text className="text-[#f5f5f1]/40">:</Text>
        {digits(pad2(pa))}
        <Text className="text-[#f5f5f1]/40">:</Text>
        <Text className="text-sm text-[#f5f5f1]/65">{digits(pad2(vi))}</Text>
      </Text>
      <Text className="mt-2 text-sm font-semibold tracking-wide text-primary">
        {pick("घडी : पला : विपला", "Ghati : Pala : Vipala")}
      </Text>

      <View className="mx-5 my-3.5 h-px bg-white/12" />

      <Text className="font-mono text-xl font-bold leading-none text-[#f5f5f1]">
        {digits(pad2(hh))}:{digits(pad2(mm))}
        <Text className="text-sm text-[#f5f5f1]/65">:{digits(pad2(ss))}</Text>
      </Text>
      <Text className="mt-2 text-sm font-semibold tracking-wide text-[#f5f5f1]/50">
        {pick("घण्टा : मिनेट", "Hour : Minute")}
      </Text>

      <View className="mt-3.5 flex-row justify-center gap-4">
        {sunrise ? (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="sunny-outline" size={14} color="rgba(245,245,241,0.8)" />
            <Text className="font-mono text-sm text-[#f5f5f1]/80">{sunrise}</Text>
          </View>
        ) : null}
        {sunset ? (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="moon-outline" size={14} color="rgba(245,245,241,0.8)" />
            <Text className="font-mono text-sm text-[#f5f5f1]/80">{sunset}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
