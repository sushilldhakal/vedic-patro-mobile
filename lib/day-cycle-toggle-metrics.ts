/** Panchanga day-boundary toggle — phone vs tablet (md breakpoint). */
export const DAY_CYCLE_TOGGLE_H_PHONE = 22;
export const DAY_CYCLE_TOGGLE_H_TABLET = 31;

export function dayCycleToggleMetrics(isCompact: boolean) {
  const height = isCompact ? DAY_CYCLE_TOGGLE_H_PHONE : DAY_CYCLE_TOGGLE_H_TABLET;
  const fontSize = isCompact ? 11 : 13;
  return {
    height,
    fontSize,
    lineHeight: fontSize + (isCompact ? 1 : 2),
  };
}
