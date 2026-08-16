/**
 * The equation of time, drawn as a curve.
 *
 * Two effects add here, and the graph exists so they can be pulled apart by
 * hand. The **eccentricity** term is one hump per year — the planet runs fast
 * near perihelion and slow near aphelion. The **tilt** term is two humps per
 * year — the Sun's motion along the ecliptic projects onto the equator at a
 * changing rate, which is zero at the solstices and largest at the equinoxes.
 *
 * Set eccentricity to zero in the playground and one hump survives; set the
 * tilt to zero and the other does. On Earth's real values they combine into
 * the familiar lopsided double wave, which is the same shape as the long axis
 * of an analemma.
 *
 * A straight port of the web app's `EotGraph`, drawn with `react-native-svg`
 * instead of DOM SVG: identical geometry, identical maths, and the same
 * hand-rolled path — the whole curve is 240 points of arithmetic, so a chart
 * library would be the heavier answer on either platform. What differs is only
 * that colours are literals here rather than `currentColor`, since a native SVG
 * has no inherited text colour to pick up.
 */

import { useMemo } from "react";
import { View } from "react-native";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";

import { Text } from "@/components/ui/Text";
import { useLocale } from "@/lib/i18n";
import { BS_MONTHS_NE, BS_MONTH_NAMES } from "@/lib/bs-calendar";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { eotCurve, solarMonthStarts } from "@/lib/sky3d/day-mechanics";

const W = 520;
const H = 158;
const PAD = { l: 34, r: 8, t: 12, b: 26 };

const SOLAR = "#dddd00";
/** What `currentColor` resolved to on the web panel — this graph is always dark. */
const INK = "#e2e8f0";

export interface EotGraphProps {
  eccentricity: number;
  /** Axial tilt in radians. */
  tilt: number;
  /** Day of the year currently on screen, for the marker. */
  dayOfYear: number;
  /** Total days in the sim's year, so the marker maps onto the 365-day curve. */
  daysPerYear: number;
}

export function EotGraph({ eccentricity, tilt, dayOfYear, daysPerYear }: EotGraphProps) {
  const { lang, pick } = useLocale();
  const ne = lang !== "en";
  const num = (v: number | string) => (ne ? toNepaliDigits(String(v)) : String(v));

  const curve = useMemo(() => eotCurve(eccentricity, tilt), [eccentricity, tilt]);

  /**
   * Symmetric scale, floored at ±4 min.
   *
   * Without the floor, a circular upright orbit — where the answer is a
   * dead-flat zero — would rescale until numerical noise filled the frame and
   * looked like signal.
   */
  const peak = useMemo(() => {
    const m = curve.reduce((a, p) => Math.max(a, Math.abs(p.minutes)), 0);
    return Math.max(4, Math.ceil(m / 4) * 4);
  }, [curve]);

  const x = (day: number) => PAD.l + (day / 365) * (W - PAD.l - PAD.r);
  const y = (min: number) => {
    const h = H - PAD.t - PAD.b;
    return PAD.t + h / 2 - (min / peak) * (h / 2);
  };

  const path = useMemo(
    () =>
      curve
        .map((p, i) => `${i ? "L" : "M"}${x(p.day).toFixed(1)} ${y(p.minutes).toFixed(1)}`)
        .join(" "),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [curve, peak],
  );

  /* The sim's year may be any length; the curve is always a real 365. */
  const markerDay = ((dayOfYear / daysPerYear) * 365) % 365;
  const markerMin = curve[Math.round((markerDay / 365) * (curve.length - 1))]?.minutes ?? 0;

  const ticks = [peak, peak / 2, 0, -peak / 2, -peak];

  /* बिक्रम months, not Gregorian ones — and they are not evenly spaced, because
     a बिक्रम month is 30° of the Sun's travel rather than a fixed run of days.
     Their unevenness is the same eccentricity the curve is plotting. */
  const monthStarts = useMemo(() => solarMonthStarts(eccentricity), [eccentricity]);
  const monthNames = ne ? BS_MONTHS_NE : ([...BS_MONTH_NAMES] as string[]);
  const currentMonth = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < 12; i += 1) if (markerDay >= monthStarts[i]!) idx = i;
    return idx;
  }, [markerDay, monthStarts]);

  return (
    <View className="w-full">
      {/* The aspect box is the wrapper's, not the SVG's: unlike DOM SVG,
          `react-native-svg` will not work a height out from the viewBox on its
          own, and a percentage height inside an auto-sized parent collapses to
          nothing. Given a sized parent, `100%` on both axes is exact. */}
      <View style={{ width: "100%", aspectRatio: W / H }}>
      <Svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        accessibilityRole="image"
        accessibilityLabel={pick(
          "समयको समीकरण — वर्षभरि साँचो सौर समय र माध्य सौर समयबीचको फरक",
          "The equation of time — true solar time minus mean solar time across a year",
        )}
      >
        {/* horizontal grid + minute labels */}
        {ticks.map((t) => (
          <G key={t}>
            <Line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={y(t)}
              y2={y(t)}
              stroke={INK}
              strokeOpacity={t === 0 ? 0.42 : 0.14}
              strokeWidth={t === 0 ? 1 : 0.6}
            />
            <SvgText
              x={PAD.l - 5}
              y={y(t) + 3}
              textAnchor="end"
              fontSize={8}
              fill={INK}
              fillOpacity={0.55}
            >
              {num(t === 0 ? 0 : `${t > 0 ? "+" : "−"}${Math.abs(t)}`)}
            </SvgText>
          </G>
        ))}

        {/* बिक्रम month boundaries, each one a सङ्क्रान्ति */}
        {monthStarts.map((d, i) => {
          const next = i === 11 ? 365 : monthStarts[i + 1]!;
          return (
            <G key={i}>
              <Line
                x1={x(d)}
                x2={x(d)}
                y1={PAD.t}
                y2={H - PAD.b + 3}
                stroke={INK}
                strokeOpacity={i === 0 ? 0.34 : 0.14}
                strokeWidth={0.7}
              />
              <SvgText
                x={x((d + next) / 2)}
                y={H - PAD.b + 12}
                textAnchor="middle"
                fontSize={7.5}
                fill={INK}
                fillOpacity={i === currentMonth ? 0.95 : 0.45}
                fontWeight={i === currentMonth ? "700" : "400"}
              >
                {monthNames[i]}
              </SvgText>
            </G>
          );
        })}

        <Path d={path} fill="none" stroke={SOLAR} strokeWidth={1.8} strokeLinejoin="round" />

        {/* where the sim is now */}
        <Line
          x1={x(markerDay)}
          x2={x(markerDay)}
          y1={PAD.t}
          y2={H - PAD.b}
          stroke={INK}
          strokeOpacity={0.45}
          strokeWidth={0.9}
          strokeDasharray="3 3"
        />
        <Circle cx={x(markerDay)} cy={y(markerMin)} r={3.6} fill={SOLAR} />

        <SvgText
          x={W - PAD.r}
          y={PAD.t + 7}
          textAnchor="end"
          fontSize={9}
          fontWeight="600"
          fill={SOLAR}
        >
          {`${markerMin >= 0 ? "+" : "−"}${num(Math.abs(markerMin).toFixed(1))} ${pick("मिनेट", "min")}`}
        </SvgText>
      </Svg>
      </View>
      <Text
        className="mt-1.5 text-[11px] leading-snug"
        style={[nepaliTextStyle(11), { color: "rgba(255,255,255,0.5)", fontSize: 11 }]}
      >
        {pick(
          "घडीभन्दा घामको समय कति अगाडि/पछाडि छ। उत्केन्द्रता शून्य पार्नुहोस् — एउटा लहर बाँकी रहन्छ; अक्ष झुकाव शून्य पार्नुहोस् — अर्को।",
          "How far a sundial runs ahead of or behind a clock. Zero the eccentricity and one wave survives; zero the tilt and the other does.",
        )}
      </Text>
    </View>
  );
}

export default EotGraph;
