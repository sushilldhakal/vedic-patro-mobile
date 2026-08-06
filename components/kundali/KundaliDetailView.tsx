import { useMemo } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { KundaliBirthPanchangaCard } from "@/components/kundali/KundaliBirthPanchangaCard";
import { DashaSystemPanel } from "@/components/kundali/DashaSystemPanel";
import { DivisionalChartCompare } from "@/components/kundali/DivisionalChartCompare";
import { YogaReferenceCatalog } from "@/components/kundali/YogaReferenceCatalog";
import {
  AshtakavargaCard,
  BhavaBalaCard,
  GrahaAstroTable,
  KundaliSection,
  ShadbalaCard,
  UpagrahaTable,
  VimshopakaCard,
  YogaList,
} from "@/components/kundali/KundaliSections";
import { ShantiVidhiPanel } from "@/components/kundali/ShantiVidhiPanel";
import type { KundaliDetailResponse } from "@/lib/api";
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
};

export function KundaliDetailView({ detail, section, ayanamshaMode, timeZone }: Props) {
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
          <ShadbalaCard shadbala={detail.shadbala} />
        </KundaliSection>
      ) : null}

      {show("kundali-bhava-bala") ? (
        <KundaliSection title={pick("भाव बल", "Bhava bala")} icon="stats-chart-outline">
          {detail.bhavaBala ? (
            <BhavaBalaCard data={detail.bhavaBala} />
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
            <AshtakavargaCard data={detail.ashtakavarga} />
          ) : (
            <Text className="py-8 text-center text-sm text-muted-foreground" style={nepaliTextStyle(14)}>
              {pick("यो खण्ड उपलब्ध छैन।", "This section is not available.")}
            </Text>
          )}
        </KundaliSection>
      ) : null}

      {show("kundali-vimshopaka") ? (
        <KundaliSection title={pick("विंशोपक बल", "Vimshopaka")} icon="grid-outline">
          {detail.vimshopaka && detail.vimshopaka.classifications.length > 0 ? (
            <VimshopakaCard data={detail.vimshopaka} />
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

      {show("kundali-report") ? (
        <Card>
          <Text className="text-sm font-semibold text-foreground" style={nepaliTextStyle(15)}>
            {pick("कुण्डली विश्लेषण", "Chart analysis")}
          </Text>
          <Text className="mt-2 text-sm leading-relaxed text-muted-foreground" style={nepaliTextStyle(14)}>
            {pick(
              "विस्तृत AI विश्लेषण रिपोर्ट हाल web (dhakal-patro) मा उपलब्ध छ। मोबाइलमा चाँडै थपिनेछ।",
              "The full AI analysis report is available on the web app today; mobile support is coming soon.",
            )}
          </Text>
        </Card>
      ) : null}
    </View>
  );
}
