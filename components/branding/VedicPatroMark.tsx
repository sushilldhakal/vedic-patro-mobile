import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Mask,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

/**
 * Official Vedic Patro brand mark — a faithful port of web `public/favicon.svg`
 * (teal tile, gold crescent hugging a rayed sun) built from react-native-svg
 * primitives. The source SVG relies on nested <svg>, <style> CSS animations and
 * `transform-box`, none of which react-native-svg supports — rendering it
 * directly paints only the background tile, so it is reconstructed here.
 */

// 16 sun-ray triangles, centred on the sun at (63.4, 50) — verbatim from favicon.svg.
const RAYS = [
  "M62.13 30.54 L63.40 18.30 L64.67 30.54 Z",
  "M69.67 31.54 L75.53 20.71 L72.02 32.51 Z",
  "M76.26 35.34 L85.82 27.58 L78.06 37.14 Z",
  "M80.89 41.38 L92.69 37.87 L81.86 43.73 Z",
  "M82.86 48.73 L95.10 50.00 L82.86 51.27 Z",
  "M81.86 56.27 L92.69 62.13 L80.89 58.62 Z",
  "M78.06 62.86 L85.82 72.42 L76.26 64.66 Z",
  "M72.02 67.49 L75.53 79.29 L69.67 68.46 Z",
  "M64.67 69.46 L63.40 81.70 L62.13 69.46 Z",
  "M57.13 68.46 L51.27 79.29 L54.78 67.49 Z",
  "M50.54 64.66 L40.98 72.42 L48.74 62.86 Z",
  "M45.91 58.62 L34.11 62.13 L44.94 56.27 Z",
  "M43.94 51.27 L31.70 50.00 L43.94 48.73 Z",
  "M44.94 43.73 L34.11 37.87 L45.91 41.38 Z",
  "M48.74 37.14 L40.98 27.58 L50.54 35.34 Z",
  "M54.78 32.51 L51.27 20.71 L57.13 31.54 Z",
];

export function VedicPatroMark({ size = 42 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" accessibilityLabel="Vedic Patro">
      <Defs>
        <LinearGradient id="vpm-g" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#f6da8a" />
          <Stop offset="0.5" stopColor="#e6b94d" />
          <Stop offset="1" stopColor="#c79126" />
        </LinearGradient>
        <RadialGradient id="vpm-sun" cx="0.38" cy="0.34" r="0.75">
          <Stop offset="0" stopColor="#fbe9b6" />
          <Stop offset="0.55" stopColor="#ecc25e" />
          <Stop offset="1" stopColor="#cf9a2c" />
        </RadialGradient>
        <RadialGradient id="vpm-halo" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#ffe6a0" stopOpacity="0.9" />
          <Stop offset="0.55" stopColor="#f4c95e" stopOpacity="0.35" />
          <Stop offset="1" stopColor="#f4c95e" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="vpm-bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#0e6a6f" />
          <Stop offset="1" stopColor="#073f43" />
        </LinearGradient>
        <Mask id="vpm-cres">
          <Rect width="100" height="100" fill="black" />
          <Circle cx="46.3" cy="50" r="41.5" fill="white" />
          <Circle cx="68.3" cy="50" r="36.6" fill="black" />
        </Mask>
      </Defs>

      <Rect width="512" height="512" rx="116" fill="url(#vpm-bg)" />

      <G transform="translate(6, 6) scale(5)">
        <Path
          d="M46.3 8.5 A41.5 41.5 0 1 0 46.3 91.5 A41.5 41.5 0 1 0 46.3 8.5 Z"
          fill="url(#vpm-g)"
          mask="url(#vpm-cres)"
        />
        <Circle cx="63.4" cy="50" r="29.3" fill="url(#vpm-halo)" />
        <G>
          {RAYS.map((d, i) => (
            <Path key={i} d={d} fill="url(#vpm-g)" />
          ))}
        </G>
        <Circle cx="63.4" cy="50" r="17.7" fill="url(#vpm-sun)" />
        <Circle cx="63.4" cy="50" r="17.7" fill="none" stroke="#073f43" strokeWidth="1.2" opacity="0.18" />
      </G>
    </Svg>
  );
}
