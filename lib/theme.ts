export const APP_NAME_NE = "वैदिक पात्रो";
export const APP_NAME_EN = "Vedic Patro";

export type ThemeColors = {
  background: string;
  foreground: string;
  text: string;
  textMuted: string;
  card: string;
  muted: string;
  mutedForeground: string;
  primary: string;
  secondary: string;
  destructive: string;
  danger: string;
  border: string;
  surfaceInset: string;
  surfaceMuted: string;
  surfaceToday: string;
  surfaceTintDanger: string;
  tabActive: string;
  accent: string;
  toneBest: string;
  toneGood: string;
  toneNeutral: string;
  toneBad: string;
  heroOverlay: readonly [string, string, string];
};

export const lightTheme: ThemeColors = {
  background: "#f8f6f2",
  foreground: "#1a1410",
  text: "#000000",
  textMuted: "#1a1410",
  card: "#ffffff",
  muted: "#f0ebe3",
  mutedForeground: "#1a1410",
  primary: "#d97706",
  secondary: "#0b565a",
  destructive: "#c62828",
  danger: "#c62828",
  border: "#e8dfd0",
  surfaceInset: "#f5f0e8",
  surfaceMuted: "#f3eee6",
  surfaceToday: "rgba(198, 40, 40, 0.14)",
  surfaceTintDanger: "rgba(198, 40, 40, 0.07)",
  tabActive: "rgba(217, 119, 6, 0.12)",
  accent: "#2e7d32",
  toneBest: "rgba(46, 125, 50, 0.14)",
  toneGood: "rgba(46, 125, 50, 0.09)",
  toneNeutral: "#f5f0e8",
  toneBad: "rgba(198, 40, 40, 0.08)",
  heroOverlay: ["rgba(0,0,0,0.82)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.4)"],
};

export const darkTheme: ThemeColors = {
  background: "#082628",
  foreground: "#ffffff",
  text: "#ffffff",
  textMuted: "rgba(255,255,255,0.88)",
  card: "#0b3d40",
  muted: "#0a3538",
  mutedForeground: "rgba(248,246,242,0.72)",
  primary: "#e67e22",
  secondary: "#d4a017",
  destructive: "#c62828",
  danger: "#c62828",
  border: "#1a5558",
  surfaceInset: "#0a3538",
  surfaceMuted: "#093032",
  surfaceToday: "rgba(198, 40, 40, 0.22)",
  surfaceTintDanger: "rgba(198, 40, 40, 0.12)",
  tabActive: "rgba(217, 119, 6, 0.16)",
  accent: "#d4a017",
  toneBest: "rgba(212, 160, 23, 0.18)",
  toneGood: "rgba(46, 125, 50, 0.14)",
  toneNeutral: "#0a3538",
  toneBad: "rgba(198, 40, 40, 0.14)",
  heroOverlay: ["rgba(0,0,0,0.82)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.4)"],
};

/** Month hero base tones — matches web month art palette when images unavailable. */
export const MONTH_HERO_COLORS: Record<number, string> = {
  1: "#0b565a",
  2: "#084548",
  3: "#1b5e20",
  4: "#2e7d32",
  5: "#b45309",
  6: "#c62828",
  7: "#0b565a",
  8: "#084548",
  9: "#1b5e20",
  10: "#2e7d32",
  11: "#b45309",
  12: "#c62828",
};
