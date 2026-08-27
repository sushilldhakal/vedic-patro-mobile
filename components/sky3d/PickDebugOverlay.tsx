/**
 * What the picker saw on the last press, on screen — temporary, dev-only.
 *
 * Exists because touch injection is not available on this machine, so the
 * gesture pipeline cannot be driven from here and demonstrated correct. This
 * lets a person tap the running app and read off, without a debugger, every
 * number the decision was made on: where the finger landed, where each nearby
 * object projected to, how far apart those were, what radius had to be beaten,
 * and how the recogniser classified the gesture.
 *
 * Renders nothing at all unless {@link pickDebug.enabled}, which is `__DEV__`.
 *
 * @todo Remove, with `lib/sky3d/pick-debug.ts`, once validated on a device.
 */

import { useSyncExternalStore } from "react";
import { Text, View } from "react-native";

import { pickDebug, subscribePickDebug } from "@/lib/sky3d/pick-debug";

const mono = { fontFamily: "Menlo", fontSize: 10, color: "#e5e7eb" } as const;

export function PickDebugOverlay() {
  /* The store is a mutable singleton bumped by `notePickDebug`, so the nonce
     is the snapshot — reading the object itself would never look changed. */
  const nonce = useSyncExternalStore(
    subscribePickDebug,
    () => pickDebug.nonce,
    () => pickDebug.nonce,
  );
  if (!pickDebug.enabled || nonce === 0) return null;
  const d = pickDebug;
  const line = (s: string) => (
    <Text key={s} style={mono}>
      {s}
    </Text>
  );
  const n = (v: number) => (Number.isFinite(v) ? v.toFixed(1) : "—");
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 8,
        top: 8,
        maxWidth: 300,
        borderRadius: 8,
        backgroundColor: "rgba(0,0,0,0.78)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
        paddingHorizontal: 8,
        paddingVertical: 6,
      }}
    >
      {line(`GESTURE  ${d.gesture ?? "—"}   travel ${n(d.travel)} / slop ${n(d.slop)}`)}
      {line(`multiTouch ${d.multiTouch ? "YES" : "no"}   dpr ${d.pixelRatio}`)}
      {line(
        `TOUCH  x ${d.touch ? n(d.touch.x) : "—"}  y ${d.touch ? n(d.touch.y) : "—"}` +
          `   viewport ${n(d.viewport.w)}x${n(d.viewport.h)}`,
      )}
      {line(`SELECTED  ${d.selected ?? "(none)"}`)}
      {d.candidates.length === 0
        ? line("(no candidates projected on screen)")
        : d.candidates.map((c, i) => (
            <Text
              key={`${c.label}:${i}`}
              style={{ ...mono, color: c.hit ? "#4ade80" : "#9ca3af" }}
            >
              {`${c.hit ? "HIT " : "miss"} ${c.label}  x ${n(c.x)} y ${n(c.y)}  d ${n(c.distance)} r ${n(c.radius)}`}
            </Text>
          ))}
    </View>
  );
}
