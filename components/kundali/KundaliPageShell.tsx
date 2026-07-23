import type { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { floatingNavBottomPadding, KUNDALI_SIDEBAR_SPLIT, PAGE_HORIZONTAL_PADDING } from "@/lib/mobile-nav";
import { nepaliTextStyle } from "@/lib/nepali-text";
import { useBreakpoint } from "@/lib/responsive";
import { KundaliSidebarNav } from "./KundaliSidebarNav";

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
  children: ReactNode;
};

export function KundaliPageShell({ eyebrow, title, subtitle, headerRight, children }: Props) {
  const { width, isTablet } = useBreakpoint();
  const splitSidebar = width >= KUNDALI_SIDEBAR_SPLIT;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="mx-auto w-full max-w-[1600px] pt-4"
      contentContainerStyle={{
        paddingBottom: floatingNavBottomPadding(isTablet),
        paddingHorizontal: PAGE_HORIZONTAL_PADDING,
      }}
    >
      <View className={splitSidebar ? "flex-row items-start gap-6" : "gap-4"}>
        {splitSidebar ? <KundaliSidebarNav className="sticky top-0" /> : null}

        <View className="min-w-0 flex-1 gap-4">
          {!splitSidebar ? <KundaliSidebarNav /> : null}

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

          {children}
        </View>
      </View>
    </ScrollView>
  );
}
