import type { ComponentProps, FC } from "react";
import type { Svg } from "react-native-svg";
import Mesha from "@/assets/rashi/mesha.svg";
import Vrishabha from "@/assets/rashi/vrishabha.svg";
import Mithuna from "@/assets/rashi/mithuna.svg";
import Karkat from "@/assets/rashi/karkat.svg";
import Simha from "@/assets/rashi/simha.svg";
import Kanya from "@/assets/rashi/kanya.svg";
import Thula from "@/assets/rashi/thula.svg";
import Vrushika from "@/assets/rashi/vrushika.svg";
import Dhanu from "@/assets/rashi/dhanu.svg";
import Makara from "@/assets/rashi/makara.svg";
import Kumbha from "@/assets/rashi/kumbha.svg";
import Meena from "@/assets/rashi/meena.svg";

import Ashwini from "@/assets/nakshatras/ashwini.svg";
import Bharani from "@/assets/nakshatras/bharani.svg";
import Krittika from "@/assets/nakshatras/krittika.svg";
import Rohini from "@/assets/nakshatras/rohini.svg";
import Mrigashira from "@/assets/nakshatras/mrigashira.svg";
import Ardra from "@/assets/nakshatras/ardra.svg";
import Punarvasu from "@/assets/nakshatras/punarvasu.svg";
import Pushya from "@/assets/nakshatras/pushya.svg";
import Ashlesha from "@/assets/nakshatras/ashlesha.svg";
import Magha from "@/assets/nakshatras/magha.svg";
import Purvaphalguni from "@/assets/nakshatras/purvaphalguni.svg";
import Uttaraphalguni from "@/assets/nakshatras/uttaraphalguni.svg";
import Hasta from "@/assets/nakshatras/hasta.svg";
import Chitra from "@/assets/nakshatras/chitra.svg";
import Swathi from "@/assets/nakshatras/swathi.svg";
import Vishakha from "@/assets/nakshatras/vishakha.svg";
import Anuradha from "@/assets/nakshatras/anuradha.svg";
import Jyeshta from "@/assets/nakshatras/jyeshta.svg";
import Mula from "@/assets/nakshatras/mula.svg";
import Purvashada from "@/assets/nakshatras/purvashada.svg";
import Uttarashada from "@/assets/nakshatras/uttarashada.svg";
import Shravana from "@/assets/nakshatras/shravana.svg";
import Dhanishta from "@/assets/nakshatras/dhanishta.svg";
import Shatabisha from "@/assets/nakshatras/shatabisha.svg";
import Purvabhadrapada from "@/assets/nakshatras/purvabhadrapada.svg";
import Uttarabhadrapada from "@/assets/nakshatras/uttarabhadrapada.svg";
import Revati from "@/assets/nakshatras/revati.svg";

import { findNakshatraIcon, NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import { rashiNumberFromName } from "@/lib/rashi-i18n";

type SvgIcon = FC<ComponentProps<typeof Svg>>;

export const RASHI_GLYPH_ICONS: readonly SvgIcon[] = [
  Mesha,
  Vrishabha,
  Mithuna,
  Karkat,
  Simha,
  Kanya,
  Thula,
  Vrushika,
  Dhanu,
  Makara,
  Kumbha,
  Meena,
];

export const NAKSHATRA_GLYPH_ICONS: readonly SvgIcon[] = [
  Ashwini,
  Bharani,
  Krittika,
  Rohini,
  Mrigashira,
  Ardra,
  Punarvasu,
  Pushya,
  Ashlesha,
  Magha,
  Purvaphalguni,
  Uttaraphalguni,
  Hasta,
  Chitra,
  Swathi,
  Vishakha,
  Anuradha,
  Jyeshta,
  Mula,
  Purvashada,
  Uttarashada,
  Shravana,
  Dhanishta,
  Shatabisha,
  Purvabhadrapada,
  Uttarabhadrapada,
  Revati,
];

function rashiIconIndex(name?: string | null, number?: number | null): number | undefined {
  if (number != null && number >= 1 && number <= 12) return number - 1;
  const n = rashiNumberFromName(name);
  return n != null ? n - 1 : undefined;
}

function nakshatraIconIndex(name?: string | null, number?: number | null): number | undefined {
  if (number != null && number >= 1 && number <= 27) return number - 1;
  const icon = findNakshatraIcon(name);
  if (!icon) return undefined;
  const idx = NAKSHATRA_ICONS.indexOf(icon);
  return idx >= 0 ? idx : undefined;
}

export function RashiGlyphIcon({
  name,
  number,
  size = 24,
}: {
  name?: string | null;
  number?: number | null;
  size?: number;
}) {
  const idx = rashiIconIndex(name, number);
  if (idx == null) return null;
  const Icon = RASHI_GLYPH_ICONS[idx];
  if (!Icon) return null;
  return <Icon width={size} height={size} />;
}

export function NakshatraGlyphIcon({
  name,
  number,
  size = 24,
}: {
  name?: string | null;
  number?: number | null;
  size?: number;
}) {
  const idx = nakshatraIconIndex(name, number);
  if (idx == null) return null;
  const Icon = NAKSHATRA_GLYPH_ICONS[idx];
  if (!Icon) return null;
  return <Icon width={size} height={size} />;
}
