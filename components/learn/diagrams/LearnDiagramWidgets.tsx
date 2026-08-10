import { Suspense, useState } from "react";
import { View } from "react-native";
import { VedicPatroLoader } from "@/components/branding/VedicPatroLoader";
import { LearnDiagramShell } from "@/components/learn/diagrams/LearnDiagramShell";
import { Canvas } from "@/components/learn/diagrams/LearnCanvas";
import { SunEarthMoonScene } from "@/components/learn/diagrams/SunEarthMoonScene";
import { AyanamshaScene } from "@/components/learn/diagrams/AyanamshaScene";
import { EclipseScene } from "@/components/learn/diagrams/EclipseScene";
import { TithiAngleScene, tithiFromDay } from "@/components/learn/diagrams/TithiAngleScene";
import { lahiriAyanamsha, SYNODIC_MONTH, TROPICAL_YEAR } from "@/lib/learn/sun-earth-moon-math";
import { useLocale } from "@/lib/i18n";

function DiagramFallback() {
  return (
    <View className="flex-1 items-center justify-center py-8">
      <VedicPatroLoader />
    </View>
  );
}

export function SunEarthMoonDiagram() {
  const { pick, digits } = useLocale();
  const [day, setDay] = useState(80);
  return (
    <LearnDiagramShell
      title={pick("३D — सूर्य, पृथ्वी, चन्द्र", "3D — Sun, Earth, Moon")}
      sliderValue={day}
      sliderMin={0}
      sliderMax={Math.floor(TROPICAL_YEAR)}
      onSliderChange={setDay}
      sliderLabel={pick(`वर्षको दिन ${digits(Math.round(day))}`, `Day of year ${digits(Math.round(day))}`)}
      caption={pick(
        "पहेंलो: सूर्य केन्द्रमा; नीलो: पृथ्वी; खैरो: चन्द्र — स्लाइडर le एक वर्ष भित्र घुमाउनुहोस्।",
        "Sun at centre; blue Earth; grey Moon — scrub through one tropical year.",
      )}
    >
      <Suspense fallback={<DiagramFallback />}>
        <Canvas camera={{ position: [0, 2.2, 3.8], fov: 48 }}>
          <SunEarthMoonScene day={day} />
        </Canvas>
      </Suspense>
    </LearnDiagramShell>
  );
}

export function TithiAngleDiagram() {
  const { pick, digits } = useLocale();
  const [day, setDay] = useState(12);
  const tithi = tithiFromDay(day);
  return (
    <LearnDiagramShell
      title={pick("३D — तिथि कोण (१२°)", "3D — tithi angle (12°)")}
      sliderValue={day}
      sliderMin={0}
      sliderMax={Math.floor(SYNODIC_MONTH * 2)}
      onSliderChange={setDay}
      sliderLabel={pick(
        `चान्द्र दिन ≈ ${digits(Math.round(day))} · तिथि ${digits(tithi)}`,
        `Lunar day ≈ ${digits(Math.round(day))} · tithi ${digits(tithi)}`,
      )}
      caption={pick(
        "हरियो चाप = चन्द्र–सूर्य कोण; १२° le एक तिथि।",
        "Green arc = Moon–Sun separation; each 12° is one tithi.",
      )}
    >
      <Suspense fallback={<DiagramFallback />}>
        <Canvas camera={{ position: [0, 1.4, 2.2], fov: 52 }}>
          <TithiAngleScene day={day} />
        </Canvas>
      </Suspense>
    </LearnDiagramShell>
  );
}

export function AyanamshaDiagram() {
  const { pick, digits } = useLocale();
  const [year, setYear] = useState(2026);
  const ayan = lahiriAyanamsha(year);
  return (
    <LearnDiagramShell
      title={pick("३D — अयनांश (लाहिरी)", "3D — ayanamsha (Lahiri)")}
      sliderValue={year}
      sliderMin={1900}
      sliderMax={2100}
      sliderStep={1}
      onSliderChange={setYear}
      sliderLabel={pick(
        `वि.सं. ≈ ${digits(year + 57)} · लाहिरी ${digits(ayan.toFixed(2))}°`,
        `CE ${digits(year)} · Lahiri ${digits(ayan.toFixed(2))}°`,
      )}
      caption={pick(
        "१२ रंग = निरयन राशि; हरियो = मेष ०°; सुन्तला = विषुव (tropical equinox) को sidereal स्थान।",
        "12 colours = sidereal rashis; green = Aries 0°; orange = spring equinox in sidereal frame.",
      )}
    >
      <Suspense fallback={<DiagramFallback />}>
        <Canvas camera={{ position: [0, 1.8, 1.6], fov: 50 }}>
          <AyanamshaScene yearCe={year} />
        </Canvas>
      </Suspense>
    </LearnDiagramShell>
  );
}

type EclipseMode = "solar" | "lunar";

export function EclipseDiagram({ mode }: { mode: EclipseMode }) {
  const { pick } = useLocale();
  const [day, setDay] = useState(mode === "solar" ? 0 : 14);
  return (
    <LearnDiagramShell
      title={
        mode === "solar"
          ? pick("३D — सूर्य ग्रहण", "3D — solar eclipse")
          : pick("३D — चन्द्र ग्रहण", "3D — lunar eclipse")
      }
      sliderValue={day}
      sliderMin={0}
      sliderMax={29}
      onSliderChange={setDay}
      sliderLabel={pick("चान्द्र चरण", "Lunar phase step")}
      caption={
        mode === "solar"
          ? pick("नयाँ चन्द्र नजिक — चन्द्र सूर्य अगाडि।", "Near new moon — Moon in front of Sun.")
          : pick("पूर्णिमा — पृथ्वीको छायाँ चन्द्रमा तिर।", "Full moon — Earth’s shadow toward the Moon.")
      }
    >
      <Suspense fallback={<DiagramFallback />}>
        <Canvas camera={{ position: [0, 0.8, 4.2], fov: 42 }}>
          <EclipseScene day={day} mode={mode} />
        </Canvas>
      </Suspense>
    </LearnDiagramShell>
  );
}
