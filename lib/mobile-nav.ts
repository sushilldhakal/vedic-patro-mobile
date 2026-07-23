import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

export type MobileNavIcon = ComponentProps<typeof Ionicons>["name"];

/** Primary floating bottom nav — matches web header sections. */
export const FLOATING_NAV = [
  { href: "/", ne: "गृह", en: "Home", icon: "home-outline" as MobileNavIcon },
  { href: "/panchanga", ne: "सूर्य पञ्चाङ्ग", en: "Panchanga", icon: "sunny-outline" as MobileNavIcon },
  { href: "/kundali", ne: "कुण्डली", en: "Kundali", icon: "sparkles-outline" as MobileNavIcon },
  { href: "/learn", ne: "सिकाइ", en: "Learn", icon: "book-outline" as MobileNavIcon },
  { href: "/dainikkranti", ne: "दैनिक क्रान्ति", en: "Transit", icon: "moon-outline" as MobileNavIcon },
] as const;

/** Secondary links — header drawer only. */
export const DRAWER_NAV_EXTRA = [
  { href: "/holidays", ne: "बिदा तथा पर्व", en: "Holidays", icon: "flag-outline" as MobileNavIcon },
  { href: "/converter", ne: "रूपान्तरण", en: "Converter", icon: "swap-horizontal-outline" as MobileNavIcon },
  { href: "/more", ne: "थप", en: "More", icon: "ellipsis-horizontal-outline" as MobileNavIcon },
] as const;

export const FLOATING_NAV_BOTTOM_PADDING = 104;

/** Standard left/right inset for page scroll content and headers. */
export const PAGE_HORIZONTAL_PADDING = 15;

/** Panchanga main + sidebar split — matches web `xl:grid-cols-[1fr_330px]` (1280px). */
export const PANCHANGA_SIDEBAR_SPLIT = 1280;
export const PANCHANGA_SIDEBAR_WIDTH = 330;

/** Bottom inset for scroll content — scales slightly on tablet. */
export function floatingNavBottomPadding(isTablet: boolean): number {
  return isTablet ? 112 : FLOATING_NAV_BOTTOM_PADDING;
}

/** Kundali list + detail share the bottom tab; milan is a stack screen. */
export const KUNDALI_SIDEBAR_SPLIT = 992;

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || pathname === "/index";
  if (href === "/kundali") {
    return (
      pathname === "/kundali" ||
      pathname.startsWith("/kundali/") ||
      pathname === "/kundali-milan"
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
