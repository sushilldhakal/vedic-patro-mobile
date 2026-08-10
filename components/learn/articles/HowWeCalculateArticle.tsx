import {
  LearnAppRouteLink,
  LearnKeys,
  LearnLede,
  LearnNote,
  LearnSection,
} from "@/components/learn/LearnProse";
import { SunEarthMoonDiagram } from "@/components/learn/diagrams/LearnDiagramWidgets";
import { useLocale } from "@/lib/i18n";

/** Native mobile article — mirrors web copy without WebView or website embeds. */
export function HowWeCalculateArticle() {
  const { pick } = useLocale();
  return (
    <>
      <LearnSection
        kicker={pick("००", "00")}
        title={pick("सारांश", "Summary")}
        subtitle={pick("Summary", "Summary")}
      >
        <LearnLede>
          {pick(
            "भारी खगोलशास्त्र र पञ्चाङ्ग गणना nepali-holiday-api (FastAPI + Swiss Ephemeris / JPL, Lahiri अयनांश) मा हुन्छ। यो मोबाइल एप API बोलाएर लेबल देखाउँछ — उही ephemeris फेरि यन्त्रमा चलाउँदैन।",
            "Heavy astronomy and panchanga math run on nepali-holiday-api (FastAPI + Swiss Ephemeris / JPL, Lahiri ayanamsha). This app calls the API for labels — it does not rerun the ephemeris on device.",
          )}
        </LearnLede>
        <LearnKeys
          items={[
            {
              title: pick("१. अनुरोध", "1. Request"),
              body: pick(
                "एपले मिति, स्थान र era पठाउँछ (उदाहरण: /api/v1/panchanga/day)।",
                "The app sends date, location, and era (e.g. /api/v1/panchanga/day).",
              ),
            },
            {
              title: pick("२. API", "2. API"),
              body: pick(
                "FastAPI ले validation, timezone, BS/AD mapping, र Swiss Ephemeris बाट कोण निकाल्छ।",
                "FastAPI validates input, resolves timezone and calendars, and computes angles with Swiss Ephemeris.",
              ),
            },
            {
              title: pick("३. प्रतिक्रिया", "3. Response"),
              body: pick(
                "तिथि, नक्षत्र, योग, करण, lagna, muhurta — JSON मा फर्किन्छ।",
                "Tithi, nakshatra, yoga, karana, lagna, muhurta — returned as JSON.",
              ),
            },
          ]}
        />
        <LearnAppRouteLink href="/panchanga">
          {pick("आजको पञ्चाङ्ग हेर्नुहोस्", "See today’s panchanga")}
        </LearnAppRouteLink>
      </LearnSection>
      <LearnSection
        kicker={pick("०१", "01")}
        title={pick("राशि भनेको के?", "What is rashi?")}
        subtitle="What is rashi?"
      >
        <LearnLede>
          {pick(
            "राशि भनेको कक्षीय मार्गमा बाँडिएका १२ equal sectors, प्रत्येक ३०° — मेष ०° देखि मीन सम्म। नेपाली पात्रो/पञ्चाङ्ग निरयन (sidereal) प्रयोग गर्छ।",
            "Rashi are 12 equal 30° sectors along the ecliptic — Aries 0° through Pisces. Nepali patro and panchanga use the sidereal zodiac.",
          )}
        </LearnLede>
      </LearnSection>
      <SunEarthMoonDiagram />
      <LearnNote>
        {pick(
          "माथिको ३D चित्र le खगोल visualize गर्छ — पञ्चाङ्ग गणना सधैं server मा (Swiss Ephemeris)।",
          "The 3D view above illustrates the sky — panchanga math always runs on the server (Swiss Ephemeris).",
        )}
      </LearnNote>
    </>
  );
}
