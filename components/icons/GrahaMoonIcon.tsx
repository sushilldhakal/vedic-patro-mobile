import { useId, type ComponentProps } from "react";
import { Circle, ClipPath, G, RadialGradient, Stop, Svg } from "react-native-svg";
import { Defs } from "@/lib/svg-defs";

type SvgProps = ComponentProps<typeof Svg>;

/** Port of `assets/graha/moon.svg` — inline so Metro never has to resolve `.svg` imports. */
export function GrahaMoonIcon({ width = 16, height = 16, ...props }: SvgProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `graha-moon-${uid}`;
  const clipId = `graha-moon-clip-${uid}`;

  return (
    <Svg width={width} height={height} viewBox="0 0 48 48" fill="none" {...props}>
      <Defs>
        <RadialGradient id={gradId} cx="38%" cy="34%" r="72%">
          <Stop offset="0%" stopColor="#eef1f5" />
          <Stop offset="100%" stopColor="#b9bfc7" />
        </RadialGradient>
        <ClipPath id={clipId}>
          <Circle cx={24} cy={24} r={17.28} />
        </ClipPath>
      </Defs>
      <Circle cx={24} cy={24} r={17.28} fill={`url(#${gradId})`} />
      <G clipPath={`url(#${clipId})`} opacity={0.4} fill="#9aa1ab">
        <Circle cx={19.68} cy={21.6} r={2.88} />
        <Circle cx={26.64} cy={25.92} r={2.16} />
        <Circle cx={24.48} cy={30.72} r={2.4} />
        <Circle cx={20.88} cy={28.8} r={1.44} />
      </G>
    </Svg>
  );
}
