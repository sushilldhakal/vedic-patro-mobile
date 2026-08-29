import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BookOpen,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ChevronRight,
  Clock3,
  Compass,
  Eclipse,
  Ellipsis,
  FileText,
  Flower2,
  Grid3x3,
  Heart,
  HeartHandshake,
  Home,
  Layers,
  Moon,
  MoonStar,
  Orbit,
  PartyPopper,
  RotateCcw,
  Route,
  Shield,
  Sparkles,
  Sprout,
  Star,
  Sun,
  Sunrise,
  User,
} from "lucide-react";
import type { DrawerIconName } from "@/lib/drawer-icons";

const LUCIDE: Record<DrawerIconName, LucideIcon> = {
  home: Home,
  star: Star,
  "book-open": BookOpen,
  compass: Compass,
  "party-popper": PartyPopper,
  "arrow-left-right": ArrowLeftRight,
  sunrise: Sunrise,
  "calendar-range": CalendarRange,
  moon: Moon,
  "calendar-clock": CalendarClock,
  sprout: Sprout,
  "grid-3x3": Grid3x3,
  sparkles: Sparkles,
  heart: Heart,
  sun: Sun,
  layers: Layers,
  "moon-star": MoonStar,
  "clock-3": Clock3,
  route: Route,
  orbit: Orbit,
  "rotate-ccw": RotateCcw,
  eclipse: Eclipse,
  "heart-handshake": HeartHandshake,
  "calendar-days": CalendarDays,
  "flower-2": Flower2,
  ellipsis: Ellipsis,
  shield: Shield,
  "file-text": FileText,
  user: User,
  "chevron-right": ChevronRight,
};

/** Same Lucide set as `dhakal-patro` MobileNavMenu — Ionicons fonts fail on Expo web. */
export function AppNavIcon({
  name,
  size,
  color,
}: {
  name: DrawerIconName;
  size: number;
  color: string;
}) {
  const Icon = LUCIDE[name];
  if (!Icon) return null;
  return <Icon size={size} strokeWidth={1.75} color={color} aria-hidden />;
}
