import { useMemo } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/Text";
import { KundaliBirthPanchangaCard } from "@/components/kundali/KundaliBirthPanchangaCard";
import { DashaSystemPanel } from "@/components/kundali/DashaSystemPanel";
import { DivisionalChartCompare } from "@/components/kundali/DivisionalChartCompare";
import { ShadbalaCard } from "@/components/kundali/ShadbalaCard";
import { AshtakavargaCard } from "@/components/kundali/AshtakavargaCard";
import { BhavaBalaCard } from "@/components/kundali/BhavaBalaCard";
import { VimshopakaCard } from "@/components/kundali/VimshopakaCard";
import { YogaReferenceCatalog } from "@/components/kundali/YogaReferenceCatalog";
import {
  GrahaAstroTable,
  KundaliSection,
  UpagrahaTable,
  YogaList,
} from "@/components/kundali/KundaliSections";
import { ShantiVidhiPanel } from "@/components/kundali/ShantiVidhiPanel";
import { KundaliReport } from "@/components/kundali/KundaliReport";
import type { KundaliDetailResponse, LocationParams } from "@/lib/api";
import type { InstantQuery } from "@/lib/instant-query";
import type { AyanamshaMode } from "@/lib/ayanamsha";
import type { KundaliSectionId } from "@/lib/kundali/kundali-section-nav";
import { useLocale } from "@/lib/i18n";
import { buildPresentYogaRefIds } from "@/lib/kundali/yoga-reference-map";
import { nepaliTextStyle } from "@/lib/nepali-text";

type Props = {
  detail: KundaliDetailResponse;
  section: KundaliSectionId;
  ayanamshaMode: AyanamshaMode;
  timeZone?: string;
  birthMoment?: InstantQuery | null;
  birthLocation?: LocationParams;
  reportDisabled?: boolean;
};

export function KundaliDetailView({
  detail,
  section,
  ayanamshaMode,
  timeZone,
  birthMoment,
  birthLocation,
  reportDisabled,
}: Props) {
  const { pick } = useLocale();
  const d1Rows = detail.vargaCharts.entries["1"] ?? [];
  const show = (id: KundaliSectionId) => section === id;
  const presentRefIds = useMemo(() => buildPresentYogaRefIds(detail.yogas), [detail.yogas]);
  const hasPresentYogas = detail.yogas.some((y) => y.present);

  return (
    <View>
      {show("kundali-overview") ? (
        <>
          <KundaliBirthPanchangaCard detail={detail} ayanamshaMode={ayanamshaMode} />
          {d1Rows.length > 0 ? (
            <DivisionalChartCompare vargaCharts={detail.vargaCharts} combustion={detail.combustion} />
          ) : null}
        </>
      ) : null}

      {show("kundali-graha") && d1Rows.length > 0 ? (
        <KundaliSection
          edgeToEdgeContent
          title={pick("ग्रह विवरण", "Graha details")}
          subtitle={pick("जन्म क्षणको स्पष्ट स्थिति", "Positions at the birth instant")}
          icon="planet-outline"
        >
          <GrahaAstroTable
            d1Rows={d1Rows}
            points={detail.vargaCharts.points}
            combustion={detail.combustion}
          />
          {detail.upagrahas?.length ? (
            <View className="mt-3 border-t border-border px-3 pt-3">
              <Text
                className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                style={nepaliTextStyle(11)}
              >
                {pick("उपग्रह", "Upagrahas")}
              </Text>
              <UpagrahaTable rows={detail.upagrahas} />
            </View>
          ) : null}
        </KundaliSection>
      ) : null}

      {show("kundali-yoga") ? (
        <KundaliSection
          title={pick("कुण्डली योग", "Kundali yogas")}
          subtitle={pick("यस कुण्डलीमा बनेका योग", "Combinations formed in this chart")}
          icon="sparkles-outline"
        >
          {hasPresentYogas ? (
            <YogaList yogas={detail.yogas} />
          ) : (
            <Text className="mb-1 text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
              {pick("यस कुण्डलीमा कुनै प्रमुख योग भेटिएन।", "No major yogas found in this chart.")}
            </Text>
          )}
          <YogaReferenceCatalog excludeIds={presentRefIds} />
        </KundaliSection>
      ) : null}

      {show("kundali-dasha") &&
      (detail.dasha || detail.tribhagiDasha || detail.yoginiDasha) ? (
        <KundaliSection title={pick("दशा", "Dasha")} subtitle={pick("दशा प्रणाली", "Dasha systems")} icon="time-outline">
          <DashaSystemPanel
            vimshottari={detail.dasha}
            tribhagi={detail.tribhagiDasha}
            yogini={detail.yoginiDasha}
            timeZone={timeZone ?? detail.panchanga.location?.timezone ?? "Asia/Kathmandu"}
          />
        </KundaliSection>
      ) : null}

      {show("kundali-shadbala") ? (
        <KundaliSection
          title={pick("षड्बल", "Shadbala")}
          subtitle={pick("ग्रह बल — रूपमा", "Planetary strength in rupas")}
          icon="barbell-outline"
        >
          <ShadbalaCard
            data={detail.shadbala}
            yuddha={detail.yuddha}
            bhavaBala={detail.bhavaBala}
            compactHeader
          />
        </KundaliSection>
      ) : null}

      {show("kundali-bhava-bala") ? (
        <KundaliSection title={pick("भाव बल", "Bhava bala")} icon="stats-chart-outline">
          {detail.bhavaBala ? (
            <BhavaBalaCard data={detail.bhavaBala} compactHeader />
          ) : (
            <Text className="py-8 text-center text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
              {pick("यो खण्ड उपलब्ध छैन।", "This section is not available.")}
            </Text>
          )}
        </KundaliSection>
      ) : null}

      {show("kundali-ashtakavarga") ? (
        <KundaliSection title={pick("अष्टकवर्ग", "Ashtakavarga")} icon="apps-outline">
          {detail.ashtakavarga ? (
            <AshtakavargaCard data={detail.ashtakavarga} compactHeader />
          ) : (
            <Text className="py-8 text-center text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
              {pick("यो खण्ड उपलब्ध छैन।", "This section is not available.")}
            </Text>
          )}
        </KundaliSection>
      ) : null}

      {show("kundali-vimshopaka") ? (
        <KundaliSection
          title={pick("विंशोपक बल", "Vimshopaka Bala")}
          icon="grid-outline"
          edgeToEdgeContent
        >
          {detail.vimshopaka && detail.vimshopaka.classifications.length > 0 ? (
            <VimshopakaCard data={detail.vimshopaka} compactHeader />
          ) : (
            <Text className="py-8 text-center text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
              {pick("यो खण्ड उपलब्ध छैन।", "This section is not available.")}
            </Text>
          )}
        </KundaliSection>
      ) : null}

      {show("kundali-shanti") ? (
        <KundaliSection
          title={pick("शान्ति विधि", "Shanti vidhi")}
          subtitle={pick("नवग्रह शान्ति उपाय", "Navagraha remedial measures")}
          icon="flame-outline"
        >
          <ShantiVidhiPanel vimshottari={detail.dasha ?? undefined} shadbala={detail.shadbala} />
        </KundaliSection>
      ) : null}

      {show("kundali-report") && birthMoment ? (
        <KundaliReport
          moment={birthMoment}
          location={birthLocation}
          ayanamsha={ayanamshaMode}
          disabled={reportDisabled}
        />
      ) : null}
    </View>
  );
}
