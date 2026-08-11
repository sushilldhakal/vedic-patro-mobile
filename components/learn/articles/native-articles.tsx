import { View } from "react-native";
import {
  LearnAppRouteLink,
  LearnFormulaRow,
  LearnKeys,
  LearnLede,
  LearnLink,
  LearnNote,
  LearnSection,
} from "@/components/learn/LearnProse";
import {
  AyanamshaDiagram,
  EclipseDiagram,
  SeasonsDiagram,
  SunEarthMoonDiagram,
  TithiAngleDiagram,
} from "@/components/learn/diagrams/LearnDiagramWidgets";
import { useLocale } from "@/lib/i18n";

function useDigits() {
  const { pick, digits } = useLocale();
  return { pick, d: digits };
}

export function AstronomyBasicsArticle() {
  const { pick, d } = useDigits();
  return (
    <>
      <LearnSection kicker={pick("०१", "01")} title={pick("आकाश कसरी देखिन्छ", "What we see from Earth")}>
        <LearnLede>
          {pick(
            "रातको आकाशमा ताराहरू टाढाका सूर्यजस्तै उज्यालो बिन्दु हुन्। दिनमा सूर्य सबैभन्दा चम्किलो; रातमा चन्द्रमा सबैभन्दा नजिकको खगोलीय पिण्ड — यिनैले पात्रो र पञ्चाङ्गको आधार बनाउँछन्।",
            "Stars at night are distant suns. By day the Sun dominates; at night the Moon is the nearest body — together they anchor patro and panchanga.",
          )}
        </LearnLede>
        <LearnKeys
          items={[
            {
              title: pick("घूर्णन vs परिक्रमा", "Rotation vs revolution"),
              body: pick(
                "घूर्णन = दिन–रात (≈ २४ घण्टा)। परिक्रमा = वर्ष वा महिना (सूर्य वा चन्द्रको वरिपरि)।",
                "Rotation = day–night (~24 h). Revolution = year or month (orbit around Sun or Earth).",
              ),
            },
            {
              title: pick("कोण", "Degrees"),
              body: pick(
                "पञ्चाङ्ग सूर्य–चन्द्रको कोणीय दूरी माप्छ — ३६०° पूर्ण वृत्त, १२° प्रति तिथि।",
                "Panchanga measures Sun–Moon separation in degrees — 360° circle, 12° per tithi.",
              ),
            },
          ]}
        />
        <LearnLink slug="solar-system">{pick("सौर्यमण्डल लेख", "Solar system article")}</LearnLink>
      </LearnSection>
      <SunEarthMoonDiagram />
      <LearnSection kicker={pick("०२", "02")} title={pick("geocentric दृष्टि", "Geocentric view")}>
        <LearnLede>
          {pick(
            "गणनामा हामी पृथ्वीबाट के देखिन्छ भन्ने framing प्रयोग गर्छौं — “सूर्य कुन राशिमा”, “चन्द्र कति अगाडि”।",
            "We compute what the sky looks like from Earth — Sun’s rashi, Moon’s elongation — the classic geocentric frame.",
          )}
        </LearnLede>
      </LearnSection>
      <SeasonsDiagram />
    </>
  );
}

export function SolarSystemArticle() {
  const { pick, d } = useDigits();
  return (
    <>
      <LearnSection kicker={pick("०१", "01")} title={pick("पृथ्वी र चन्द्र", "Earth and Moon")}>
        <LearnLede>
          {pick(
            "चन्द्रमा पृथ्वीको वरिपरि ≈ २९.५ दिनमा एक परिक्रमा गर्छ — तिथि र पक्ष यही गतिमा आधारित। पृथ्वी सूर्यको वरिपरि ≈ ३६५ दिनमा घुम्छ — वर्ष र संक्रान्ति।",
            "The Moon orbits Earth in ~29.5 days — tithi and phases follow that motion. Earth orbits the Sun in ~365 days — year and sankranti.",
          )}
        </LearnLede>
        <LearnFormulaRow
          items={[
            {
              value: `~${d(29.5)}`,
              label: pick("चन्द्र महिना", "Synodic month"),
              desc: pick("नयाँ चन्द्रदेखि अर्को", "New moon to new moon"),
            },
            {
              value: d(365),
              label: pick("सौर वर्ष", "Solar year"),
              desc: pick("संक्रान्ति चक्र", "Sankranti cycle"),
            },
          ]}
        />
      </LearnSection>
      <SunEarthMoonDiagram />
      <LearnLink slug="tithi">{pick("तिथि कसरी बन्छ", "How tithi is formed")}</LearnLink>
    </>
  );
}

export function BsCalendarArticle() {
  const { pick } = useDigits();
  return (
    <>
      <LearnSection kicker={pick("०१", "01")} title={pick("विक्रम सम्वत्", "Bikram Sambat")}>
        <LearnLede>
          {pick(
            "नेपाली पात्रो चान्द्र महिना + सौर संक्रान्ति मिलाएर चल्छ। महिनाको सुरु अधिकांशतः नयाँ चन्द्र/near-new moon संग जोडिन्छ; वर्ष संख्या परम्परागत BS epoch बाट।",
            "The Nepali patro blends lunar months with solar sankranti. Months usually start near the new moon; the year count follows the Bikram Sambat epoch.",
          )}
        </LearnLede>
        <LearnKeys
          items={[
            {
              title: pick("सौर महिना", "Solar month"),
              body: pick("सूर्य एक राशि छोडेर अर्को — संक्रान्ति।", "Sun moves from one rashi to the next — sankranti."),
            },
            {
              title: pick("चान्द्र महिना", "Lunar month"),
              body: pick("एक अमावस्या/पूर्णिमा चक्र — तिथि १–३०।", "One lunation — tithi 1–30."),
            },
          ]}
        />
      </LearnSection>
      <LearnAppRouteLink href="/">{pick("पात्रो हेर्नुहोस्", "Open calendar")}</LearnAppRouteLink>
    </>
  );
}

export function CalendarDifferencesArticle() {
  const { pick } = useDigits();
  return (
    <>
      <LearnSection kicker={pick("०१", "01")} title={pick("तीन पात्रो", "Three calendars")}>
        <LearnLede>
          {pick(
            "ग्रेगोरियन = सौर, fixed lengths। भारतीय/नेपाली = चान्द्र–सौर hybrid — महिना चन्द्रमा, ऋतु/संक्रान्ति सूर्यमा। त्यसैले एउटै AD दिनमा BS तिथि फरक देशमा फरक हुन सक्छ।",
            "Gregorian is purely solar. Nepali/Indian calendars are luni-solar — lunar months, solar seasons. The same AD day can map to different tithi by region.",
          )}
        </LearnLede>
      </LearnSection>
      <LearnLink slug="adhik-maas">{pick("अधिक मास", "Adhik maas")}</LearnLink>
    </>
  );
}

export function AdhikMaasArticle() {
  const { pick } = useDigits();
  return (
    <>
      <LearnSection kicker={pick("०१", "01")} title={pick("अधिक मास किन?", "Why adhik maas?")}>
        <LearnLede>
          {pick(
            "१२ चान्द्र महिना १२ सौर महिनाभन्दा छोटो — वर्षभरि झण्डै ११ दिनको gap। कहिलेकाहीँ एउटै चान्द्र महिना दुई संक्रान्ति बीचमा पर्छ — त्यो महिनालाई अधिक (intercalary) भनिन्छ।",
            "Twelve lunar months are shorter than twelve solar months — roughly an 11-day drift. Sometimes one lunar month contains no sankranti; that month is adhik (intercalary).",
          )}
        </LearnLede>
        <LearnNote>
          {pick(
            "Vedic Patro API ले adhik/vaishakh जस्ता edge cases official tables + astronomy बाट handle गर्छ।",
            "Vedic Patro’s API handles adhik months using official tables plus astronomy.",
          )}
        </LearnNote>
      </LearnSection>
      <SunEarthMoonDiagram />
    </>
  );
}

export function RituDriftArticle() {
  const { pick } = useDigits();
  return (
    <>
      <LearnSection kicker={pick("०१", "01")} title={pick("ऋतु सर्ने", "Season drift")}>
        <LearnLede>
          {pick(
            "सायन (tropical) ऋतु वसंत equinox मा fix — precession le sidereal ऋतु slowly shift हुन्छ। नेपाली पञ्चाङ्ग निरयन (sidereal) rashis प्रयोग गर्छ — Lahiri ayanamsha le tropical/sidereal gap define गर्छ।",
            "Tropical seasons are tied to the equinoxes; sidereal rashis slowly drift due to precession. Nepali panchanga uses sidereal signs — Lahiri ayanamsha defines the offset.",
          )}
        </LearnLede>
        <LearnLink slug="ayanamsha">{pick("अयनांश", "Ayanamsha")}</LearnLink>
      </LearnSection>
      <SeasonsDiagram />
      <AyanamshaDiagram />
    </>
  );
}

export function WhatIsPanchangArticle() {
  const { pick } = useDigits();
  return (
    <>
      <LearnSection kicker={pick("०१", "01")} title={pick("पाँच अङ्ग", "Five limbs")}>
        <LearnLede>
          {pick(
            "पञ्चाङ्ग = तिथि, वार, नक्षत्र, योग, करण — दैनिक खगोलीय snapshot। यसैमा वर/अवर, sunrise, muhurta, lagna जोडिन्छ।",
            "Panchanga = tithi, weekday, nakshatra, yoga, karana — the daily sky snapshot. Vara, sunrise, muhurta, and lagna build on this.",
          )}
        </LearnLede>
        <LearnKeys
          items={[
            { title: pick("तिथि", "Tithi"), body: pick("चन्द्र–सूर्य १२°", "Moon–Sun 12° arc") },
            { title: pick("नक्षत्र", "Nakshatra"), body: pick("चन्द्रको nakshatra", "Moon’s nakshatra") },
            { title: pick("योग", "Yoga"), body: pick("सूर्य+चन्द्र sum mod 360", "Sun+Moon sum mod 360") },
            { title: pick("करण", "Karana"), body: pick("तिथिको आधा", "Half of a tithi") },
          ]}
        />
        <LearnAppRouteLink href="/panchanga">{pick("आजको पञ्चाङ्ग", "Today’s panchanga")}</LearnAppRouteLink>
      </LearnSection>
    </>
  );
}

export function TithiArticle() {
  const { pick, d } = useDigits();
  return (
    <>
      <LearnSection kicker={pick("०१", "01")} title={pick("१२° नियम", "The 12° rule")}>
        <LearnLede>
          {pick(
            "तिथि = चन्द्र सूर्यभन्दा कति कोण अगाडि छ, १२° ले भाग — १ देखि ३० (वा १५ शुक्ल + १५ कृष्ण)।",
            "Tithi is Moon’s elongation from the Sun divided by 12° — 1 through 30 (15 bright + 15 dark fortnight).",
          )}
        </LearnLede>
        <LearnFormulaRow
          items={[
            { value: d(360), label: "°", desc: pick("पूर्ण वृत्त", "Full circle") },
            { value: d(12), label: pick("° / तिथि", "° per tithi"), desc: pick("३० तिथि", "30 tithis") },
          ]}
        />
      </LearnSection>
      <TithiAngleDiagram />
      <View className="gap-2">
        <LearnLink slug="tithi-vriddhi">{pick("तिथि वृद्धि", "Tithi vriddhi")}</LearnLink>
        <LearnLink slug="tithi-kshaya">{pick("तिथि क्षय", "Tithi kshaya")}</LearnLink>
      </View>
    </>
  );
}

export function TithiVriddhiArticle() {
  const { pick } = useDigits();
  return (
    <LearnSection kicker={pick("०१", "01")} title={pick("दोहोरिने तिथि", "Repeated tithi")}>
      <LearnLede>
        {pick(
          "एक AD दिनमा दुई sunrise बीच तिथि परिवर्तन नभई एउटै तिथि दुई calendar days सम्म टिक्छ — vriddhi।",
          "When the tithi does not change between successive sunrises, the same tithi repeats on two civil days — vriddhi.",
        )}
      </LearnLede>
    </LearnSection>
  );
}

export function TithiKshayaArticle() {
  const { pick } = useDigits();
  return (
    <LearnSection kicker={pick("०१", "01")} title={pick("छुट्ने तिथि", "Skipped tithi")}>
      <LearnLede>
        {pick(
          "एक sunrise–sunrise window भित्र दुई तिथि समाप्त भए एक तिथि calendar मा देखिँदैन — kshaya।",
          "If two tithis complete between one sunrise and the next, one tithi never appears on the calendar — kshaya.",
        )}
      </LearnLede>
    </LearnSection>
  );
}

export function NakshatraArticle() {
  const { pick, d } = useDigits();
  return (
    <LearnSection kicker={pick("०१", "01")} title={pick("२७ नक्षत्र", "27 nakshatras")}>
      <LearnLede>
        {pick(
          `चन्द्रको sidereal longitude ${d(360)}° लai ${d(27)} equal parts मा बाँडिन्छ — प्रत्येक ~${d(13)}°२०′। दिनभरि चन्द्र नक्षत्र बदल्न सक्छ।`,
          `The Moon’s sidereal longitude is split into ${d(27)} parts of ~${d(13)}°20′ each. The active nakshatra can change during the day.`,
        )}
      </LearnLede>
    </LearnSection>
  );
}

export function YogaArticle() {
  const { pick, d } = useDigits();
  return (
    <LearnSection kicker={pick("०१", "01")} title={pick("२७ योग", "27 yogas")}>
      <LearnLede>
        {pick(
          "योग = (सूर्य sidereal + चन्द्र sidereal) mod 360°, १३°२०′ le भाग — २७ नाम। शुभ/अशुभ परम्परा almanac अनुसार।",
          "Yoga = (sidereal Sun + sidereal Moon) mod 360°, divided into 27 names of 13°20′ each. Auspiciousness follows almanac tradition.",
        )}
      </LearnLede>
    </LearnSection>
  );
}

export function KaranaArticle() {
  const { pick, d } = useDigits();
  return (
    <LearnSection kicker={pick("०१", "01")} title={pick("११ करण", "11 karanas")}>
      <LearnLede>
        {pick(
          "प्रत्येक तिथि दुई करण (६° each) — ७ चल करण + ४ स्थिर (शकुनि, चतुष्पाद, नाग, किमस्तु)।",
          "Each tithi has two karanas (6° each) — seven rotating plus four fixed (Śakuni, Catuṣpāda, Nāga, Kimstu).",
        )}
      </LearnLede>
    </LearnSection>
  );
}

export function SankrantiArticle() {
  const { pick } = useDigits();
  return (
    <>
      <LearnSection kicker={pick("०१", "01")} title={pick("सङ्क्रान्ति", "Sankranti")}>
        <LearnLede>
          {pick(
            "सूर्यले sidereal राशि परिवर्तन गर्दाको क्षण — महिनाको सौर anchor। नेपालमा माघ/बैशाख संक्रान्ति विशेष चाड।",
            "The instant the Sun enters a new sidereal rashi — the solar anchor of the month. Magh and Baisakh sankranti are major festivals in Nepal.",
          )}
        </LearnLede>
      </LearnSection>
      <SunEarthMoonDiagram />
      <LearnAppRouteLink href="/suryakranti">{pick("सूर्यक्रान्ति पृष्ठ", "Suryakranti screen")}</LearnAppRouteLink>
    </>
  );
}

export function HoraArticle() {
  const { pick } = useDigits();
  return (
    <LearnSection kicker={pick("०१", "01")} title={pick("ग्रहीय होरा", "Planetary hora")}>
      <LearnLede>
        {pick(
          "दिन sunrise देखि sunset सम्म १२ होरा, रात पनि १२ — weekday lord बाट sequence सुरु। प्रत्येक होरा ≈ १ घण्टा (season/location le stretch)।",
          "Daytime has 12 horas from sunrise to sunset, night another 12 — sequence starts from the weekday lord. Each hora is roughly one hour (varies by season and latitude).",
        )}
      </LearnLede>
    </LearnSection>
  );
}

export function EclipsesArticle() {
  const { pick } = useDigits();
  return (
    <>
      <LearnSection kicker={pick("०१", "01")} title={pick("ग्रहण", "Eclipses")}>
        <LearnLede>
          {pick(
            "सूर्य ग्रहण = नयाँ/अमावस्या नजिक Moon Sun अगाडि। चन्द्र ग्रहण = पूर्णिमा नजिक Earth को shadow। Node proximity र elongation decide visibility।",
            "Solar eclipse — Moon near new moon crosses the Sun. Lunar eclipse — full moon enters Earth’s shadow. Nodes and geometry set visibility.",
          )}
        </LearnLede>
      </LearnSection>
      <EclipseDiagram mode="solar" />
      <EclipseDiagram mode="lunar" />
      <View className="gap-2">
        <LearnAppRouteLink href="/panchanga/surya-grahan">
          {pick("सूर्य ग्रहण सूची", "Solar eclipse list")}
        </LearnAppRouteLink>
        <LearnAppRouteLink href="/panchanga/chandra-grahan">
          {pick("चन्द्र ग्रहण सूची", "Lunar eclipse list")}
        </LearnAppRouteLink>
      </View>
    </>
  );
}

export function AyanamshaArticle() {
  const { pick } = useDigits();
  return (
    <>
      <LearnSection kicker={pick("०१", "01")} title={pick("अयनांश", "Ayanamsha")}>
        <LearnLede>
          {pick(
            "Tropical र sidereal zodiac बीचको offset — precession le बढ्दै जान्छ। Vedic Patro default Lahiri (Chitrapaksha); Raman/KP अन्य tradition।",
            "Offset between tropical and sidereal zodiac — grows with precession. Vedic Patro defaults to Lahiri; Raman and KP are other traditions.",
          )}
        </LearnLede>
        <LearnNote>
          {pick(
            "API responses Lahiri sidereal positions प्रयोग गर्छन् — web र mobile एउटै backend।",
            "API responses use Lahiri sidereal positions — web and mobile share one backend.",
          )}
        </LearnNote>
      </LearnSection>
      <AyanamshaDiagram />
    </>
  );
}
