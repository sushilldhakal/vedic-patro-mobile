/**
 * The sky's compass — a rotary dial docked bottom-centre over the canvas.
 *
 * Three things happen through this one control, because they are three
 * views of the same fact — which way the sky is facing:
 *
 * 1. **Drag it.** Spin the dial with a finger and the camera's yaw follows,
 *    the same way turning a real compass card under a fixed lubber line
 *    does — N/E/S/W paint on the rotating disc, a fixed pointer at the top
 *    names whichever one you're currently facing.
 * 2. **Double-tap it.** Toggles AR mode — the back camera behind the sky,
 *    the dial itself switched from something you turn to something that
 *    reports the phone's own heading.
 * 3. **In AR mode**, the dial is read-only: {@link heading} is driven by
 *    {@link useDeviceOrientation} rather than by touch, so it is always
 *    showing the direction the lens is actually pointed.
 */

import { useCallback, useRef } from "react";
import { View, type LayoutChangeEvent, PanResponder } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { normalizeDeg } from "@/lib/sky3d/geocentric-model";

const DIAL_SIZE = 84;
const RADIUS = DIAL_SIZE / 2;
/** A drag shorter than this, released quickly, reads as a tap rather than a spin. */
const TAP_SLOP_PX = 6;
const DOUBLE_TAP_MS = 320;

const POINTS: { deg: number; label: string; major: boolean }[] = [
  { deg: 0, label: "उ", major: true },
  { deg: 90, label: "पू", major: true },
  { deg: 180, label: "द", major: true },
  { deg: 270, label: "प", major: true },
];

export function CompassControl({
  heading,
  onHeadingChange,
  arMode,
  onToggleArMode,
  visible = true,
}: {
  /** Degrees, 0 = north, clockwise — the same frame the sky's own az is in. */
  heading: number;
  /** Fired continuously while dragging (ignored while {@link arMode} is on). */
  onHeadingChange: (heading: number) => void;
  arMode: boolean;
  onToggleArMode: () => void;
  /** Hidden outside the horizon view — there is no "facing direction" from space or the globe. */
  visible?: boolean;
}) {
  const center = useRef({ x: 0, y: 0 });
  const gesture = useRef({ startAngle: 0, startHeading: 0, moved: 0 });
  const lastTapAt = useRef(0);
  const containerRef = useRef<View>(null);

  // The responder below is built once (`useRef`, not `useMemo`), so its
  // callbacks close over whatever `heading`/`arMode`/the two handlers were on
  // the first render. Refs kept in step with every render are what let them
  // read the current values instead of those stale ones.
  const headingRef = useRef(heading);
  headingRef.current = heading;
  const arModeRef = useRef(arMode);
  arModeRef.current = arMode;
  const onHeadingChangeRef = useRef(onHeadingChange);
  onHeadingChangeRef.current = onHeadingChange;
  const onToggleArModeRef = useRef(onToggleArMode);
  onToggleArModeRef.current = onToggleArMode;

  const onLayout = useCallback((_e: LayoutChangeEvent) => {
    // Absolute (page) coordinates, not the layout event's local ones — touch
    // events report page coordinates, and the dial can sit inside scrolled
    // or transformed ancestors where the two disagree.
    containerRef.current?.measureInWindow((x, y, w, h) => {
      center.current = { x: x + w / 2, y: y + h / 2 };
    });
  }, []);

  const angleAt = (pageX: number, pageY: number) =>
    Math.atan2(pageY - center.current.y, pageX - center.current.x) * (180 / Math.PI);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { pageX, pageY } = e.nativeEvent;
        gesture.current = {
          startAngle: angleAt(pageX, pageY),
          startHeading: headingRef.current,
          moved: 0,
        };
      },
      onPanResponderMove: (e, g) => {
        gesture.current.moved = Math.max(gesture.current.moved, Math.hypot(g.dx, g.dy));
        if (arModeRef.current) return;
        const { pageX, pageY } = e.nativeEvent;
        const delta = angleAt(pageX, pageY) - gesture.current.startAngle;
        onHeadingChangeRef.current(normalizeDeg(gesture.current.startHeading + delta));
      },
      onPanResponderRelease: () => {
        if (gesture.current.moved > TAP_SLOP_PX) return;
        const now = Date.now();
        if (now - lastTapAt.current < DOUBLE_TAP_MS) {
          lastTapAt.current = 0;
          onToggleArModeRef.current();
        } else {
          lastTapAt.current = now;
        }
      },
    }),
  ).current;

  if (!visible) return null;

  return (
    <View
      ref={containerRef}
      onLayout={onLayout}
      {...responder.panHandlers}
      pointerEvents="box-only"
      className="absolute bottom-3 items-center justify-center rounded-full border border-white/20 bg-black/45"
      style={{ width: DIAL_SIZE, height: DIAL_SIZE, left: "50%", marginLeft: -RADIUS }}
    >
      {/* The lubber line: fixed, names whichever cardinal is currently faced. */}
      <View pointerEvents="none" className="absolute -top-1 items-center">
        <Ionicons name="caret-down" size={12} color={arMode ? "#f4c542" : "rgba(255,255,255,0.75)"} />
      </View>

      {/* The card itself: turns opposite the heading, so its printed उ/पू/द/प stay world-anchored. */}
      <View
        pointerEvents="none"
        style={{
          width: DIAL_SIZE,
          height: DIAL_SIZE,
          transform: [{ rotate: `${-heading}deg` }],
        }}
      >
        {POINTS.map((p) => {
          const a = (p.deg * Math.PI) / 180;
          const r = RADIUS - 14;
          const x = RADIUS + r * Math.sin(a) - 8;
          const y = RADIUS - r * Math.cos(a) - 8;
          return (
            <View key={p.deg} className="absolute h-4 w-4 items-center justify-center" style={{ left: x, top: y }}>
              <Text
                className="text-[11px] font-bold"
                style={[
                  nepaliTextStyle(11),
                  { color: p.deg === 0 ? "#ff8a8a" : "rgba(255,255,255,0.85)" },
                ]}
              >
                {p.label}
              </Text>
            </View>
          );
        })}
      </View>

      {arMode ? (
        <View pointerEvents="none" className="absolute -bottom-1 rounded-full bg-black/70 px-1">
          <Ionicons name="camera" size={10} color="#f4c542" />
        </View>
      ) : null}
    </View>
  );
}
