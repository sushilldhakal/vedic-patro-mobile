import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { useLocale } from "@/lib/i18n";

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const PAGE_LOADER_SIZE = 120;

const WRAY_PATHS = [
  "M49.04 32.03 L50.00 22.00 L50.96 32.03 Z",
  "M58.15 33.95 L64.00 25.75 L59.82 34.92 Z",
  "M65.08 40.18 L74.25 36.00 L66.05 41.85 Z",
  "M67.97 49.04 L78.00 50.00 L67.97 50.96 Z",
  "M66.05 58.15 L74.25 64.00 L65.08 59.82 Z",
  "M59.82 65.08 L64.00 74.25 L58.15 66.05 Z",
  "M50.96 67.97 L50.00 78.00 L49.04 67.97 Z",
  "M41.85 66.05 L36.00 74.25 L40.18 65.08 Z",
  "M34.92 59.82 L25.75 64.00 L33.95 58.15 Z",
  "M32.03 50.96 L22.00 50.00 L32.03 49.04 Z",
  "M33.95 41.85 L25.75 36.00 L34.92 40.18 Z",
  "M40.18 34.92 L36.00 25.75 L41.85 33.95 Z",
];

const DOTS = [
  [50, 10, 3], [60.35, 11.36, 2.83], [70, 15.36, 2.67], [78.28, 21.72, 2.5],
  [84.64, 30, 2.33], [88.64, 39.65, 2.17], [90, 50, 2], [88.64, 60.35, 1.83],
  [84.64, 70, 1.67], [78.28, 78.28, 1.5], [70, 84.64, 1.33], [60.35, 88.64, 1.17],
  [50, 90, 1], [39.65, 88.64, 1.17], [30, 84.64, 1.33], [21.72, 78.28, 1.5],
  [15.36, 70, 1.67], [11.36, 60.35, 1.83], [10, 50, 2], [11.36, 39.65, 2.17],
  [15.36, 30, 2.33], [21.72, 21.72, 2.5], [30, 15.36, 2.67], [39.65, 11.36, 2.83],
] as const;

/** Animated loader — same artwork as web `public/loader.svg`. */
function LoaderGraphic({ size }: { size: number }) {
  const dotsSpin = useSharedValue(0);
  const wraysSpin = useSharedValue(0);
  const ringSpin = useSharedValue(0);
  const haloOpacity = useSharedValue(0.4);
  const sunScale = useSharedValue(1);

  useEffect(() => {
    dotsSpin.value = withRepeat(withTiming(360, { duration: 48000, easing: Easing.linear }), -1, false);
    wraysSpin.value = withRepeat(withTiming(-360, { duration: 30000, easing: Easing.linear }), -1, false);
    ringSpin.value = withRepeat(withTiming(-360, { duration: 60000, easing: Easing.linear }), -1, false);
    haloOpacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 1700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    sunScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [dotsSpin, wraysSpin, ringSpin, haloOpacity, sunScale]);

  const ringProps = useAnimatedProps(() => ({
    rotation: ringSpin.value,
    originX: 50,
    originY: 50,
  }));
  const dotsProps = useAnimatedProps(() => ({
    rotation: dotsSpin.value,
    originX: 50,
    originY: 50,
  }));
  const wraysProps = useAnimatedProps(() => ({
    rotation: wraysSpin.value,
    originX: 50,
    originY: 50,
  }));
  const haloProps = useAnimatedProps(() => ({ opacity: haloOpacity.value }));
  const sunProps = useAnimatedProps(() => ({
    scale: sunScale.value,
    originX: 50,
    originY: 50,
  }));

  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Defs>
        <LinearGradient id="ldr-g" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#f6da8a" />
          <Stop offset="0.5" stopColor="#e6b94d" />
          <Stop offset="1" stopColor="#c79126" />
        </LinearGradient>
        <RadialGradient id="ldr-sun" cx="38%" cy="34%" r="75%">
          <Stop offset="0" stopColor="#fbe9b6" />
          <Stop offset="0.55" stopColor="#ecc25e" />
          <Stop offset="1" stopColor="#cf9a2c" />
        </RadialGradient>
        <RadialGradient id="ldr-halo" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#ffe6a0" stopOpacity={0.9} />
          <Stop offset="0.55" stopColor="#f4c95e" stopOpacity={0.35} />
          <Stop offset="1" stopColor="#f4c95e" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="ldr-bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#0e6a6f" />
          <Stop offset="1" stopColor="#073f43" />
        </LinearGradient>
      </Defs>
      <Rect width="512" height="512" rx="116" fill="url(#ldr-bg)" />
      <G transform="translate(26, 26) scale(4.6)">
        <AnimatedG animatedProps={ringProps}>
          <Circle cx="50" cy="50" r="44" fill="none" stroke="url(#ldr-g)" strokeWidth="1.4" opacity={0.5} />
        </AnimatedG>
        <Circle cx="50" cy="50" r="33" fill="none" stroke="url(#ldr-g)" strokeWidth="1.4" opacity={0.5} />
        <AnimatedG animatedProps={dotsProps}>
          {DOTS.map(([cx, cy, r], i) => (
            <Circle key={i} cx={cx} cy={cy} r={r} fill="url(#ldr-g)" />
          ))}
        </AnimatedG>
        <AnimatedCircle animatedProps={haloProps} cx="50" cy="50" r="24" fill="url(#ldr-halo)" />
        <AnimatedG animatedProps={wraysProps}>
          {WRAY_PATHS.map((d, i) => (
            <Path key={i} d={d} fill="url(#ldr-g)" />
          ))}
        </AnimatedG>
        <AnimatedG animatedProps={sunProps}>
          <Circle cx="50" cy="50" r="16" fill="url(#ldr-sun)" />
          <Circle cx="50" cy="50" r="4.4" fill="#073f43" opacity={0.8} />
        </AnimatedG>
      </G>
    </Svg>
  );
}

export function VedicPatroLoader({
  label,
  size = PAGE_LOADER_SIZE,
  className,
}: {
  label?: string | null;
  size?: number;
  className?: string;
}) {
  const { pick } = useLocale();
  const shown = label === undefined ? pick("लोड हुँदैछ…", "Loading…") : label;

  return (
    <View className={`items-center justify-center gap-4 ${className ?? ""}`}>
      <View className="overflow-hidden rounded-[22%] shadow-md" style={{ width: size, height: size }}>
        <LoaderGraphic size={size} />
      </View>
      {shown ? <Text className="text-sm text-muted-foreground">{shown}</Text> : null}
    </View>
  );
}
