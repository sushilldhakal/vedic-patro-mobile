import type { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { floatingNavBottomPadding, KUNDALI_SIDEBAR_SPLIT, PAGE_HORIZONTAL_PADDING } from "@/lib/mobile-nav";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { useBreakpoint } from "@/lib/responsive";
import { useThemeColors } from "@/lib/theme-context";
import { PanchangaSidebarNav } from "@/components/panchanga/PanchangaSidebarNav";
import { KundaliSectionNav } from "./KundaliSectionNav";
import type { KundaliSectionId } from "@/lib/kundali/kundali-section-nav";

const SIDEBAR_RAIL_WIDTH = 224;

type SectionNavProps = {
  activeId: KundaliSectionId;
  onNavigate: (id: KundaliSectionId) => void;
};

type Props = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  variant?: "list" | "detail";
  sectionNav?: SectionNavProps;
};

/** Kundali pages — same sidebar shell as `PanchangaShellLayout` / web panchanga layout. */
export function KundaliPageShell({
  eyebrow,
  title,
  subtitle,
  headerRight,
  children,
  variant = "list",
  sectionNav,
}: Props) {
  const colors = useThemeColors();
  const { width, isTablet, isLandscape } = useBreakpoint();
  const showSidebar = width >= KUNDALI_SIDEBAR_SPLIT || isLandscape;
  const isDetail = variant === "detail";

  const mainScrollProps = {
    className: "flex-1 bg-background" as const,
    contentContainerClassName: "mx-auto w-full max-w-[1600px] pt-4",
    contentContainerStyle: {
      paddingBottom: floatingNavBottomPadding(isTablet),
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
    },
    showsVerticalScrollIndicator: false as const,
  };

  const mainColumn = (
    <View className="gap-4">
      {!showSidebar && isDetail && sectionNav ? (
        <KundaliSectionNav
          variant="horizontal"
          activeId={sectionNav.activeId}
          onNavigate={sectionNav.onNavigate}
        />
      ) : null}

      {!isDetail && title ? (
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            {eyebrow ? (
              <Text
                className="mb-1.5 text-xs uppercase tracking-[0.12em] text-muted-foreground"
                style={[nepaliTextStyle(12), { paddingTop: 2 }]}
              >
                {eyebrow}
              </Text>
            ) : null}
            <Text
              className="text-xl font-bold text-foreground"
              style={[nepaliTextStyle(20), { paddingTop: 2, paddingBottom: 2 }]}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                className="mt-1 text-sm text-muted-foreground"
                style={[nepaliTextStyle(14), { paddingTop: 1 }]}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
          {headerRight}
        </View>
      ) : null}

      {children}
    </View>
  );

  if (!showSidebar) {
    return <ScrollView {...mainScrollProps}>{mainColumn}</ScrollView>;
  }

  return (
    <View className="flex-1 flex-row bg-background">
      <View
        style={{
          width: SIDEBAR_RAIL_WIDTH,
          paddingTop: 16,
          paddingBottom: 12,
          paddingLeft: PAGE_HORIZONTAL_PADDING,
          paddingRight: 8,
          borderRightWidth: 1,
          borderRightColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
          <PanchangaSidebarNav
            className="w-full border-0 shadow-none"
            compact
            kundaliSectionNav={isDetail ? sectionNav : undefined}
          />
        </ScrollView>
      </View>

      <ScrollView {...mainScrollProps}>{mainColumn}</ScrollView>
    </View>
  );
}
