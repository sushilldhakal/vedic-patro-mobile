import type { MobileNavIcon } from "@/lib/mobile-nav";
import { CEREMONY_META, ELEMENT_META } from "@/lib/panchanga-elements";

export type DrawerNavItem = {
  id: string;
  href: string;
  labelNe: string;
  labelEn: string;
  icon: MobileNavIcon;
};

export type DrawerNavSection = {
  id: string;
  titleNe: string;
  titleEn: string;
  items: DrawerNavItem[];
};

const patroItems: DrawerNavItem[] = [
  { id: "holidays", href: "/holidays", labelNe: "बिदा तथा पर्व", labelEn: "Holidays", icon: "flag-outline" },
  { id: "converter", href: "/converter", labelNe: "रूपान्तरण", labelEn: "Converter", icon: "swap-horizontal-outline" },
  { id: "suryakranti", href: "/suryakranti", labelNe: "सूर्यक्रान्ति", labelEn: "Sun times", icon: "sunny-outline" },
  { id: "panchanga-year", href: "/panchanga/year", labelNe: "वार्षिक पञ्चाङ्ग", labelEn: "Year wheel", icon: "disc-outline" },
  { id: "dainikkranti", href: "/dainikkranti", labelNe: "दैनिक क्रान्ति", labelEn: "Daily transit", icon: "moon-outline" },
  { id: "panchak-patro", href: "/panchak-patro", labelNe: "पञ्चक पात्रो", labelEn: "Panchak", icon: "warning-outline" },
  { id: "ritu", href: "/ritu", labelNe: "ऋतु", labelEn: "Seasons", icon: "leaf-outline" },
];

const jyotishItems: DrawerNavItem[] = [
  { id: "rashifal", href: "/rashifal", labelNe: "राशिफल", labelEn: "Rashifal", icon: "star-outline" },
  { id: "avakahada", href: "/panchanga/avakahada-chakra", labelNe: "अवकहडा चक्र", labelEn: "Avakahada", icon: "aperture-outline" },
  { id: "abhijit", href: "/abhijit-muhurta", labelNe: "अभिजित् मुहूर्त", labelEn: "Abhijit", icon: "flash-outline" },
  { id: "kundali", href: "/kundali", labelNe: "जन्मकुण्डली", labelEn: "Birth chart", icon: "sparkles-outline" },
  { id: "kundali-milan", href: "/jyotish/kundali-milan", labelNe: "कुण्डली मिलान", labelEn: "Chart matching", icon: "heart-outline" },
];

const grahaItems: DrawerNavItem[] = [
  { id: "aakash-gochar", href: "/aakash-gochar", labelNe: "३D आकाश गोचर", labelEn: "3D sky gochar", icon: "planet-outline" },
  { id: "gochar", href: "/gochar", labelNe: "गोचर", labelEn: "Gochar", icon: "git-branch-outline" },
  { id: "graha-sthiti", href: "/panchanga/graha-sthiti", labelNe: "ग्रह स्थिति", labelEn: "Graha sthiti", icon: "planet-outline" },
  { id: "graha-asta", href: "/panchanga/graha-asta", labelNe: "ग्रह अस्त", labelEn: "Heliacal set", icon: "sunny-outline" },
  { id: "graha-vakri", href: "/panchanga/graha-vakri", labelNe: "ग्रह वक्री", labelEn: "Retrograde", icon: "refresh-outline" },
  { id: "chandra-grahan", href: "/panchanga/chandra-grahan", labelNe: "चन्द्र ग्रहण", labelEn: "Lunar eclipse", icon: "moon-outline" },
  { id: "surya-grahan", href: "/panchanga/surya-grahan", labelNe: "सूर्य ग्रहण", labelEn: "Solar eclipse", icon: "ellipse-outline" },
];

function elementItems(kind: "span" | "table"): DrawerNavItem[] {
  return ELEMENT_META.filter((e) => e.kind === kind).map((e) => ({
    id: e.id,
    href: `/panchanga/element/${e.id}`,
    labelNe: e.titleNe,
    labelEn: e.titleEn,
    icon: kind === "span" ? "arrow-forward-circle-outline" : "grid-outline",
  }));
}

function saitItems(): DrawerNavItem[] {
  return CEREMONY_META.map((c) => ({
    id: c.id,
    href: c.id === "vivah" ? "/vivah-sait" : `/sait/${c.id}`,
    labelNe: c.titleNe,
    labelEn: c.titleEn,
    icon: "heart-outline" as MobileNavIcon,
  }));
}

/** Drawer sections — mirrors web `MobileNavMenu` + sidebar sections. */
export function getMobileDrawerSections(): DrawerNavSection[] {
  return [
    { id: "patro", titleNe: "पात्रो तथा मिति", titleEn: "Patro & dates", items: patroItems },
    { id: "jyotish", titleNe: "ज्योतिष तथा मुहूर्त", titleEn: "Jyotish & muhurta", items: jyotishItems },
    { id: "spans", titleNe: "संक्रमण तत्त्व", titleEn: "Transition elements", items: elementItems("span") },
    { id: "graha", titleNe: "ग्रह विवरण", titleEn: "Planet details", items: grahaItems },
    { id: "tables", titleNe: "दैनिक तालिका", titleEn: "Daily tables", items: elementItems("table") },
    { id: "sait", titleNe: "शुभ मुहूर्त", titleEn: "Auspicious muhurta", items: saitItems() },
  ];
}

export const DRAWER_MAIN_LINKS: DrawerNavItem[] = [
  { id: "home", href: "/", labelNe: "गृह", labelEn: "Home", icon: "home-outline" },
  { id: "panchanga", href: "/panchanga", labelNe: "सूर्य पञ्चाङ्ग", labelEn: "Panchanga", icon: "sunny-outline" },
  { id: "learn", href: "/learn", labelNe: "सिकाइ", labelEn: "Learn", icon: "book-outline" },
  { id: "shanti", href: "/shanti-vidhi", labelNe: "शान्ति विधि", labelEn: "Shanti vidhi", icon: "flower-outline" },
  { id: "more", href: "/more", labelNe: "थप", labelEn: "More", icon: "ellipsis-horizontal-outline" },
];
