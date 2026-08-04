import { useMemo, useState } from "react";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { GeocentricSky } from "@/components/sky3d/GeocentricSky";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { PanchangaDateNav } from "@/components/panchanga/PanchangaDateNav";
import { Text } from "@/components/ui/Text";
import { fetchGochar, gocharKeys } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";
import { resolveTimeZone, todayAdStringInTimezone } from "@/lib/zoned-time";

/**
 * Spike screen: the 3D geocentric sky driven by the live gochar longitudes.
 * Kept out of the tab bar — this exists to evaluate three.js on device.
 */
export default function Sky3dDemoScreen() {
  const { pick } = useLocale();
  const { location, setLocation } = usePanchangaLocation();
  const tz = resolveTimeZone(undefined, location.params.timezone);
  const todayAd = todayAdStringInTimezone(new Date(), tz);
  const [date, setDate] = useState(() => new Date(`${todayAd}T12:00:00`));

  const dateAd = useMemo(() => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [date]);

  const query = useQuery({
    queryKey: gocharKeys.day(dateAd, "ad", location.params),
    queryFn: () => fetchGochar(dateAd, "ad", location.params),
  });

  return (
    <AppShell
      title={pick("त्रिआयामिक आकाश", "3D sky")}
      subtitle={pick(
        "भूकेन्द्रित सौर्यमण्डल — राशि र नक्षत्र वलय सहित",
        "Geocentric solar system with the rashi and nakshatra belts",
      )}
    >
      <LocationSelector location={location} onLocationChange={setLocation} />
      <PanchangaDateNav date={date} onDateChange={setDate} todayAd={todayAd} />

      {query.data?.gochar ? (
        <GeocentricSky source={query.data.gochar} height={380} />
      ) : (
        <View className="items-center rounded-2xl border border-dashed border-border py-16">
          <Text className="text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
            {pick("लोड हुँदै…", "Loading…")}
          </Text>
        </View>
      )}

      <Text className="mt-3 text-sm leading-relaxed text-muted-foreground" style={nepaliTextStyle(13)}>
        {pick(
          "पृथ्वी केन्द्रमा; प्रत्येक ग्रह आफ्नो निरयन देशान्तरमा राखिएको छ र दृष्टि-रेखाले राशि वलयमा प्रक्षेपण देखाउँछ — यही कुरा २D चक्रले समतलमा देखाउँछ।",
          "Earth sits at the centre; each graha is placed at its true sidereal longitude and a sight line projects it onto the zodiac belt — the same thing the 2D wheel shows flattened.",
        )}
      </Text>
    </AppShell>
  );
}
