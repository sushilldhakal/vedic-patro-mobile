export type PanchangaSidebarItem = {
  id: string;
  href: string;
  labelNe: string;
  labelEn: string;
  blurbNe?: string;
  blurbEn?: string;
};

export type PanchangaSidebarSection = {
  id: string;
  titleNe: string;
  titleEn: string;
  items: PanchangaSidebarItem[];
};

/** Mobile routes — mirrors web `panchanga-sidebar-nav` (unimplemented screens → /more). */
export const PANCHANGA_SIDEBAR_SECTIONS: PanchangaSidebarSection[] = [
  {
    id: "patro",
    titleNe: "पात्रो तथा मिति",
    titleEn: "Patro & dates",
    items: [
      { id: "holidays", href: "/holidays", labelNe: "बिदा तथा पर्व", labelEn: "Holidays" },
      { id: "converter", href: "/converter", labelNe: "रूपान्तरण", labelEn: "Converter" },
      { id: "suryakranti", href: "/more", labelNe: "सूर्यक्रान्ति", labelEn: "Sun times" },
      { id: "panchanga-year", href: "/panchanga", labelNe: "वार्षिक पञ्चाङ्ग चक्र", labelEn: "Annual panchanga wheel" },
      { id: "dainikkranti", href: "/dainikkranti", labelNe: "दैनिक क्रान्ति", labelEn: "Daily transits" },
      { id: "panchak-patro", href: "/more", labelNe: "पञ्चक पात्रो", labelEn: "Panchak calendar" },
      { id: "ritu", href: "/more", labelNe: "ऋतु", labelEn: "Seasons" },
    ],
  },
  {
    id: "jyotish",
    titleNe: "ज्योतिष तथा मुहूर्त",
    titleEn: "Jyotish & muhurta",
    items: [
      { id: "avakahada", href: "/more", labelNe: "अवकहडा चक्र", labelEn: "Avakahada chakra" },
      { id: "abhijit", href: "/more", labelNe: "अभिजित् मुहूर्त", labelEn: "Abhijit muhurta" },
      { id: "kundali", href: "/kundali", labelNe: "जन्मकुण्डली निर्माण", labelEn: "Birth chart builder" },
      { id: "kundali-milan", href: "/kundali-milan", labelNe: "कुण्डली मिलान", labelEn: "Chart matching" },
    ],
  },
  {
    id: "graha",
    titleNe: "ग्रह विवरण",
    titleEn: "Planet details",
    items: [
      {
        id: "graha-sthiti",
        href: "/more",
        labelNe: "ग्रह स्थिति",
        labelEn: "Planetary positions",
        blurbNe: "नौ ग्रह र लग्नको दैनिक स्थिति",
        blurbEn: "Daily positions of 9 grahas + lagna",
      },
      { id: "graha-asta", href: "/more", labelNe: "ग्रह अस्त", labelEn: "Heliacal set" },
      { id: "graha-vakri", href: "/more", labelNe: "ग्रह वक्री", labelEn: "Retrograde" },
      { id: "chandra-grahan", href: "/more", labelNe: "चन्द्र ग्रहण", labelEn: "Lunar eclipse" },
      { id: "surya-grahan", href: "/more", labelNe: "सूर्य ग्रहण", labelEn: "Solar eclipse" },
    ],
  },
];

import { normalizeMobilePathname } from "@/lib/mobile-nav";

export function isPanchangaSidebarItemActive(pathname: string, item: PanchangaSidebarItem): boolean {
  pathname = normalizeMobilePathname(pathname);
  if (item.id === "kundali") {
    return pathname === "/kundali" || pathname.startsWith("/kundali/");
  }
  if (item.href === "/") return pathname === "/" || pathname === "/index";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function findActivePanchangaSidebarSection(pathname: string): string | null {
  for (const section of PANCHANGA_SIDEBAR_SECTIONS) {
    if (section.items.some((item) => isPanchangaSidebarItemActive(pathname, item))) {
      return section.id;
    }
  }
  return null;
}
