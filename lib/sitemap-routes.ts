import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

export type MobileNavIcon = ComponentProps<typeof Ionicons>["name"];

/** All public routes aligned with vedicpatro.com sitemap. */
export type SitemapRoute = {
  path: string;
  ne: string;
  en: string;
  icon: MobileNavIcon;
  group: "main" | "panchanga" | "jyotish" | "learn" | "sait" | "tools";
};

export const SITEMAP_ROUTES: SitemapRoute[] = [
  { path: "/", ne: "गृह", en: "Home", icon: "home-outline", group: "main" },
  { path: "/panchanga", ne: "पञ्चाङ्ग", en: "Panchanga", icon: "sunny-outline", group: "main" },
  { path: "/panchanga/year", ne: "वार्षिक चक्र", en: "Year wheel", icon: "disc-outline", group: "panchanga" },
  { path: "/panchanga/details", ne: "पञ्चाङ्ग विवरण", en: "Panchanga details", icon: "grid-outline", group: "panchanga" },
  { path: "/panchanga/avakahada-chakra", ne: "अवकहडा चक्र", en: "Avakahada", icon: "aperture-outline", group: "panchanga" },
  { path: "/gochar", ne: "गोचर", en: "Gochar", icon: "git-branch-outline", group: "panchanga" },
  { path: "/panchanga/graha-sthiti", ne: "ग्रह स्थिति", en: "Graha sthiti", icon: "planet-outline", group: "panchanga" },
  { path: "/panchanga/graha-asta", ne: "ग्रह अस्त", en: "Heliacal set", icon: "sunny-outline", group: "panchanga" },
  { path: "/panchanga/graha-vakri", ne: "ग्रह वक्री", en: "Retrograde", icon: "refresh-outline", group: "panchanga" },
  { path: "/panchanga/surya-grahan", ne: "सूर्य ग्रहण", en: "Solar eclipse", icon: "ellipse-outline", group: "panchanga" },
  { path: "/panchanga/chandra-grahan", ne: "चन्द्र ग्रहण", en: "Lunar eclipse", icon: "moon-outline", group: "panchanga" },
  { path: "/dainikkranti", ne: "दैनिक क्रान्ति", en: "Daily transit", icon: "moon-outline", group: "main" },
  { path: "/shanti-vidhi", ne: "शान्ति विधि", en: "Shanti vidhi", icon: "flower-outline", group: "tools" },
  { path: "/converter", ne: "रूपान्तरण", en: "Converter", icon: "swap-horizontal-outline", group: "tools" },
  { path: "/holidays", ne: "बिदा", en: "Holidays", icon: "flag-outline", group: "tools" },
  { path: "/ritu", ne: "ऋतु", en: "Seasons", icon: "leaf-outline", group: "tools" },
  { path: "/kundali", ne: "कुण्डली", en: "Kundali", icon: "sparkles-outline", group: "jyotish" },
  { path: "/jyotish/kundali-milan", ne: "कुण्डली मिलान", en: "Kundali milan", icon: "heart-outline", group: "jyotish" },
  { path: "/learn", ne: "सिकाइ", en: "Learn", icon: "book-outline", group: "learn" },
  { path: "/learn/history", ne: "इतिहास", en: "History", icon: "time-outline", group: "learn" },
  { path: "/suryakranti", ne: "सूर्यक्रान्ति", en: "Sun times", icon: "sunny-outline", group: "panchanga" },
  { path: "/abhijit-muhurta", ne: "अभिजित्", en: "Abhijit", icon: "flash-outline", group: "panchanga" },
  { path: "/panchak-patro", ne: "पञ्चक", en: "Panchak", icon: "warning-outline", group: "panchanga" },
  { path: "/vivah-sait", ne: "विवाह साइत", en: "Marriage muhurta", icon: "heart-outline", group: "sait" },
];

export const SITEMAP_LEARN_SLUGS = [
  "astronomy-basics",
  "solar-system",
  "bs-calendar",
  "calendar-differences",
  "adhik-maas",
  "ritu-drift",
  "what-is-panchang",
  "tithi",
  "tithi-vriddhi",
  "tithi-kshaya",
  "nakshatra",
  "yoga",
  "karana",
  "sankranti",
  "hora",
  "eclipses",
  "ayanamsha",
] as const;

export const SITEMAP_ELEMENT_IDS = [
  "tithi",
  "nakshatra",
  "yoga",
  "karana",
  "chandra-rashi",
  "choghadiya",
  "hora",
  "lagna",
  "udaya-lagna",
  "chandrabala",
  "tarabala",
  "panchaka-rahita",
  "pushkara",
] as const;

export const SITEMAP_SAIT_CATEGORIES = [
  "vivah",
  "bratabandha",
  "griha-aarambha",
  "griha-pravesh",
  "byaparik-pratisthan",
  "rudri-jurne",
  "agni-jurne",
  "annaprasan",
] as const;
