export type KundaliSidebarItem = {
  id: string;
  href: string;
  labelNe: string;
  labelEn: string;
};

export type KundaliSidebarSection = {
  id: string;
  titleNe: string;
  titleEn: string;
  items: KundaliSidebarItem[];
};

/** Jyotish section from web `panchanga-sidebar-nav` — kundali + milan only. */
export const KUNDALI_SIDEBAR_SECTIONS: KundaliSidebarSection[] = [
  {
    id: "jyotish",
    titleNe: "ज्योतिष तथा मुहूर्त",
    titleEn: "Jyotish & muhurta",
    items: [
      {
        id: "kundali",
        href: "/kundali",
        labelNe: "जन्मकुण्डली निर्माण",
        labelEn: "Birth chart builder",
      },
      {
        id: "kundali-milan",
        href: "/kundali-milan",
        labelNe: "कुण्डली मिलान",
        labelEn: "Chart matching",
      },
    ],
  },
];

export function isKundaliSidebarItemActive(pathname: string, item: KundaliSidebarItem): boolean {
  if (item.id === "kundali") {
    return pathname === "/kundali" || pathname.startsWith("/kundali/");
  }
  return pathname === item.href;
}
