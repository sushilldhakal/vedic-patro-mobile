import { Ionicons } from "@expo/vector-icons";
import { DRAWER_IONICONS, type DrawerIconName } from "@/lib/drawer-icons";

/** Native: Ionicons. Web uses Lucide SVGs (`AppNavIcon.web.tsx`) to match vedicpatro.com. */
export function AppNavIcon({
  name,
  size,
  color,
}: {
  name: DrawerIconName;
  size: number;
  color: string;
}) {
  return <Ionicons name={DRAWER_IONICONS[name]} size={size} color={color} />;
}
