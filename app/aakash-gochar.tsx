import { useMemo, useState } from "react";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { AakashGocharSky } from "@/components/sky3d/AakashGocharSky";
import { VedicPatroLoader } from "@/components/branding/VedicPatroLoader";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { PanchangaDateNav } from "@/components/panchanga/PanchangaDateNav";
import { Text } from "@/components/ui/Text";
import { fetchGochar, gocharKeys } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { NEPAL_CITIES } from "@/lib/cities/nepal-cities";
import { KATHMANDU, type Observer } from "@/lib/sky3d/horizon";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";
import { resolveTimeZone, todayAdStringInTimezone } from "@/lib/zoned-time";

/**
 * 3D Aakash Gochar — the live sky in three dimensions, seen from the Earth.
 *
 * The API supplies the sidereal longitudes for the chosen date; the scene pins
 * its own orbital model onto them and animates outward from there, so pressing
 * play walks the real gochar forward rather than an approximation of it.
 */
export default function AakashGocharScreen() {
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

  /* The horizon view needs real coordinates. Backend city ids carry none, so
     fall back through the local city table and finally to Kathmandu. */
  const observer: Observer = useMemo(() => {
    const { lat, lon, city_id: cityId } = location.params;
    if (lat != null && lon != null) return { lat, lon };
    const city = cityId != null ? NEPAL_CITIES.find((c) => c.id === cityId) : undefined;
    return city ? { lat: city.lat, lon: city.lon } : KATHMANDU;
  }, [location.params]);

  const query = useQuery({
    queryKey: gocharKeys.day(dateAd, "ad", location.params),
    queryFn: () => fetchGochar(dateAd, "ad", location.params),
  });

  return (
    <AppShell
      title={pick("३D आकाश गोचर", "3D Aakash Gochar")}
      subtitle={pick(
        "पृथ्वीबाट देखिने भूकेन्द्रित आकाश — राशि र नक्षत्र वलय सहित",
        "The geocentric sky as the Earth sees it, with the rashi and nakshatra belts",
      )}
    >
      <LocationSelector location={location} onLocationChange={setLocation} />
      <PanchangaDateNav date={date} onDateChange={setDate} todayAd={todayAd} />

      {query.isLoading ? (
        <View className="items-center rounded-2xl border border-dashed border-border py-16">
          <VedicPatroLoader />
        </View>
      ) : (
        /* The scene runs on its own model, so a failed fetch costs accuracy for
           the day on screen, not the view itself. */
        <AakashGocharSky
          gochar={query.data?.gochar}
          ayanamsaDeg={query.data?.ayanamsa?.degrees}
          date={date}
          observer={observer}
          timeZone={tz}
          height={460}
        />
      )}

      <View className="mt-3 gap-2">
        <Text className="text-sm leading-relaxed text-muted-foreground" style={nepaliTextStyle(13)}>
          {pick(
            "पृथ्वी केन्द्रमा छ र क्यामेरा त्यसैको वरिपरि घुम्छ — यही भूकेन्द्रित दृष्टिकोणबाट वैदिक गोचर हेरिन्छ। प्रत्येक ग्रह आफ्नो निरयन देशान्तर र शरमा राखिएको छ, र चन्द्रदेखि शनिसम्मको परम्परागत क्रममा आफ्नो कक्षमा हिँड्छ।",
            "Earth sits at the centre and the camera orbits it — the geocentric standpoint Vedic gochar is read from. Each graha is placed at its true sidereal longitude and shara, riding a shell in the classical Moon-to-Saturn order.",
          )}
        </Text>
        <Text className="text-sm leading-relaxed text-muted-foreground" style={nepaliTextStyle(13)}>
          {pick(
            "«यहाँबाट आकाश» दृश्यमा माथिको स्थान र मिति-समय अनुसार क्षितिज बन्छ — राशि वलय अक्षांश अनुसार ढल्किन्छ र घण्टै पिच्छे घुम्छ, त्यसैले यो पृथ्वीको कक्षसँग समानान्तर देखिँदैन। पहेँलो रेखा खगोलीय विषुवत् हो; त्यससँगको २३.४४° को झुकाव यहीँ प्रस्ट देखिन्छ।",
            "In “Sky from here” the horizon is built from the location and date-time above — the rashi belt tips with your latitude and swings with the hour, which is why it does not sit parallel to anything. The gold line is the celestial equator; the 23.44° tilt between the two is visible right there.",
          )}
        </Text>
        <Text className="text-sm leading-relaxed text-muted-foreground" style={nepaliTextStyle(13)}>
          {pick(
            "गति रेखाले ४५ दिन अघि र पछिको बाटो देखाउँछ — मंगल वा शनि वक्री हुँदा त्यही रेखामा पछाडि फर्किएको पासो देखिन्छ। कुनै पनि ग्रह छोएर नजिक पुग्न सकिन्छ; «पूरा दृश्य» ले फेरि सिङ्गो सौर्यमण्डल देखाउँछ।",
            "The trail draws 45 days either side of the moment on screen — when Mars or Saturn turns vakri you can watch the loop close on itself. Tap any graha to fly in close to it; “Zoom out” pulls back to the whole system.",
          )}
        </Text>
      </View>
    </AppShell>
  );
}
