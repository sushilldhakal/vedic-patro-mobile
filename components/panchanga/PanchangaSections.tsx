import { Text, View } from "react-native";
import type { PanchangaDay } from "@/lib/api";
import { useTranslation } from "@/lib/i18n-translations.web";
import {
  formatAayanLabel,
  formatDurationFull,
  formatMadhyahnaDisplay,
  formatNepalSambatDisplay,
  formatPakshaLabel,
  formatPakshaNepaliDisplay,
  formatShakaYear,
  formatTimeShort,
  formatGhatiEnd,
  getDinVisheshLabels,
  getMuhurtaRows,
  getMoonriseDisplay,
  getMoonsetDisplay,
  getAayanPauranik,
  getAayanVedic,
  getRituPauranik,
  getRituVedic,
  formatRituLabel,
  getPanchangaDetail,
  getLagnaDisplay,
  getPlanetRows,
  getPlanetsAnchorLabel,
  formatSolarCorrectionDisplay,
  getSolarCorrections,
  getSunriseDisplay,
  getSunsetDisplay,
  getVaaraNe,
  formatRashiDisplay,
  formatSpanEndTime,
  getChandrabalam,
  getChandraRashiSpans,
  getNakshatraPadaSpans,
  getPanchakaRahita,
  getSuryaNakshatra,
  getSuryaRashi,
  getTarabalam,
  getUdayaLagna,
  formatShortClock,
  formatTimeRangeShort,
  getNivasShool,
  toNepaliDigits,
} from "@/lib/panchanga-format.web";
import type { NivasShoolSegment } from "@/lib/api";
import { resolveSamvatsaraForBsYear } from "@/lib/samvatsara";
import type { BalamChip } from "@/lib/api";
import {
  DenseListRow,
  DenseListTable,
  PanchangaFullRow,
  PanchangaQuadRow,
  PanchangaSection,
  PanchangaSubBlock,
  PanchangaTableBody,
  PairedTimingTable,
  SectionSplitPanel,
  TimingRange,
  UptoValue,
  usePanchangaLayoutWide,
} from "./PanchangaLayout";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

type AngaEnd = {
  name_ne?: string;
  name?: string;
  end_local_time?: string;
  end_ghati_clock?: string;
  end_hours_clock?: string;
};

type Anga = AngaEnd & {
  next?: AngaEnd;
};

function angaEndTime(anga?: AngaEnd | null): string | undefined {
  if (!anga) return undefined;
  const t =
    formatTimeShort(anga.end_local_time) ??
    formatTimeShort(anga.end_hours_clock) ??
    formatGhatiEnd(anga.end_ghati_clock);
  return t ? toNepaliDigits(t) : undefined;
}

function AngaCell({ anga }: { anga?: Anga | null }) {
  const { pick } = useLocale();
  if (!anga) return <Text>—</Text>;
  const name = pick(anga.name_ne ?? anga.name ?? "—", anga.name ?? anga.name_ne ?? "—");
  const next = anga.next;
  const nextName = next?.name_ne ?? next?.name;
  return (
    <>
      <UptoValue name={name} endTime={angaEndTime(anga)} />
      {nextName ? (
        // The next anga now carries its own end time — on a kshaya-tithi day
        // this is where the skipped tithi's ending shows (e.g. प्रतिपदा … सम्म).
        <UptoValue
          name={pick(nextName, next?.name ?? next?.name_ne ?? nextName)}
          endTime={angaEndTime(next)}
        />
      ) : null}
    </>
  );
}

export function SunMoonSamvatSection({ p }: { p: PanchangaDay }) {
  const { pick, lang, digits } = useLocale();
  const solar = getSolarCorrections(p);
  const belaantar = formatSolarCorrectionDisplay(solar?.belaantar);
  const deshaantar = formatSolarCorrectionDisplay(solar?.deshaantar);
  const detail = getPanchangaDetail(p);
  const bs = (detail?.bs_date ?? p.bs_date) as
    | { year?: number; month_name_ne?: string; month_name?: string; day?: number }
    | undefined;
  const ns = formatNepalSambatDisplay(p);
  const shaka = formatShakaYear(p);
  const samvatsara = bs?.year
    ? resolveSamvatsaraForBsYear(bs.year, p.samvatsara as Parameters<typeof resolveSamvatsaraForBsYear>[1])
    : undefined;
  const pakshaLabel = formatPakshaLabel(p, lang) ?? "—";

  return (
    <PanchangaSection titleKey="sections.sun_moon_samvat">
      <PanchangaTableBody>
        <PanchangaQuadRow
          left={{
            labelKey: "sections.sunrise",
            children: (
              <>
                <Text>🌅</Text>
                <Text className="font-mono font-semibold">{getSunriseDisplay(p) ?? "—"}</Text>
              </>
            ),
          }}
          right={{
            labelKey: "sections.vikram",
            children: (
              <Text className="font-semibold">
                {bs?.year && bs.day && (bs.month_name_ne || bs.month_name)
                  ? `${digits(bs.year)} ${pick(bs.month_name_ne ?? bs.month_name ?? "", bs.month_name ?? bs.month_name_ne ?? "")} ${digits(bs.day)}`
                  : (p.display?.bs_ne ?? "—")}
              </Text>
            ),
          }}
        />
        <PanchangaQuadRow
          left={{
            labelKey: "sections.sunset",
            children: (
              <>
                <Text>🌇</Text>
                <Text className="font-mono font-semibold">{getSunsetDisplay(p) ?? "—"}</Text>
              </>
            ),
          }}
          right={{
            labelKey: "sections.samvatsara",
            children: (
              <Text className="font-semibold">
                {samvatsara ? pick(samvatsara.name_ne, samvatsara.name_en) : "—"}
              </Text>
            ),
          }}
        />
        <PanchangaQuadRow
          left={{
            labelKey: "sections.moonrise",
            children: (
              <>
                <Text>🌒</Text>
                <Text className="font-mono font-semibold">{getMoonriseDisplay(p, lang) ?? "—"}</Text>
              </>
            ),
          }}
          right={{
            labelKey: "sections.shaka",
            children: (
              <Text className="font-semibold">{shaka ? digits(shaka) : "—"}</Text>
            ),
          }}
        />
        <PanchangaQuadRow
          left={{
            labelKey: "sections.moonset",
            children: (
              <>
                <Text>🌘</Text>
                <Text className="font-mono font-semibold">{getMoonsetDisplay(p, lang) ?? "—"}</Text>
              </>
            ),
          }}
          right={{
            labelKey: "sections.nepal_sambat",
            children: <Text className="font-semibold">{ns ?? "—"}</Text>,
          }}
        />
        {belaantar ? (
          <PanchangaQuadRow
            left={{
              labelKey: "sections.equation_of_time",
              children: <Text className="font-mono font-semibold">{belaantar}</Text>,
            }}
            right={{
              labelKey: "sections.paksha",
              children: <Text className="font-semibold">{pakshaLabel}</Text>,
            }}
          />
        ) : (
          <PanchangaQuadRow
            left={{
              labelKey: "sections.paksha",
              children: <Text className="font-semibold">{pakshaLabel}</Text>,
            }}
          />
        )}
        {deshaantar ? (
          <PanchangaFullRow labelKey="sections.longitude_correction">
            <Text className="font-mono font-semibold">{deshaantar}</Text>
          </PanchangaFullRow>
        ) : null}
      </PanchangaTableBody>
      {solar?.ishtakaal_note_ne ? (
        <Text className="border-t border-border px-4 py-2 text-sm m-0 leading-snug">
          {solar.ishtakaal_note_ne}
        </Text>
      ) : null}
    </PanchangaSection>
  );
}

/** @deprecated use SunMoonSamvatSection */
export function SunMoonSection({ p }: { p: PanchangaDay }) {
  return <SunMoonSamvatSection p={p} />;
}

/** @deprecated use SunMoonSamvatSection */
export function SamvatSection(_props: { p: PanchangaDay }) {
  return null;
}

export function PanchangCoreSection({ p }: { p: PanchangaDay }) {
  const detail = getPanchangaDetail(p);
  const instant = p.mode === "ephemeris";
  const tithi = (instant ? p.tithi : detail?.tithi ?? p.tithi) as Anga | undefined;
  const nakshatra = (instant ? p.nakshatra : detail?.nakshatra ?? p.nakshatra) as Anga | undefined;
  const yoga = (instant ? p.yoga : detail?.yoga ?? p.yoga) as Anga | undefined;
  const karana = (instant ? p.karana : detail?.karana ?? p.karana) as Anga | undefined;
  const paksha = formatPakshaNepaliDisplay(p);
  const pakshaName = (detail?.paksha as { name?: string } | undefined)?.name;
  const pakshaSym = pakshaName === "shukla" ? "🌕" : "🌑";

  return (
    <PanchangaSection titleKey="sections.panchang_core">
      <PanchangaTableBody>
        <PanchangaQuadRow
          left={{ labelKey: "tithi", children: <AngaCell anga={tithi} /> }}
          right={{ labelKey: "nakshatra", children: <AngaCell anga={nakshatra} /> }}
        />
        <PanchangaQuadRow
          left={{ labelKey: "sections.yoga", children: <AngaCell anga={yoga} /> }}
          right={{ labelKey: "sections.karana", children: <AngaCell anga={karana} /> }}
        />
        <PanchangaQuadRow
          left={{
            labelKey: "sections.weekday",
            children: <Text className="font-semibold">{getVaaraNe(p, p.weekday) ?? "—"}</Text>,
          }}
          right={{
            labelKey: "sections.paksha",
            children: (
              <>
                <Text>{pakshaSym}</Text>
                <Text className="font-semibold">{paksha ?? "—"}</Text>
              </>
            ),
          }}
        />
      </PanchangaTableBody>
    </PanchangaSection>
  );
}

export function RashiSection({ p }: { p: PanchangaDay }) {
  const { t } = useTranslation();
  const { pick, lang, digits } = useLocale();
  const detail = getPanchangaDetail(p);
  const moonRashiSpans = getChandraRashiSpans(p);
  const padaSpans = getNakshatraPadaSpans(p);
  const suryaRashi = getSuryaRashi(p);
  const suryaNak = getSuryaNakshatra(p);

  const rawMoon = (detail?.chandra_rashi ?? p.chandra_rashi) as
    | string
    | { name_ne?: string; name?: string; number?: number }
    | undefined;
  const fallbackMoon =
    typeof rawMoon === "string" ? { name_ne: rawMoon } : rawMoon;
  const moonSpans =
    moonRashiSpans ??
    (fallbackMoon?.name_ne || fallbackMoon?.name
      ? [{ name_ne: fallbackMoon.name_ne, name: fallbackMoon.name, number: fallbackMoon.number }]
      : []);

  return (
    <PanchangaSection titleKey="sections.rashi_pada">
      <PanchangaTableBody>
        <PanchangaQuadRow
          left={{
            labelKey: "sections.moon_sign",
            children:
              moonSpans.length > 0 ? (
                <View className="flex flex-col gap-0 w-full">
                  {moonSpans.map((span, i) => (
                    <Text key={`moon-rashi-${i}`} className="inline-flex flex-wrap items-baseline gap-x-1.5">
                      <Text className="font-semibold">
                        {formatRashiDisplay(span.name_ne, span.name, lang)}
                      </Text>
                      {formatSpanEndTime(span) ? (
                        <Text className="text-sm font-mono font-semibold text-foreground whitespace-nowrap">
                          {formatSpanEndTime(span)} {t("sections.until")}
                        </Text>
                      ) : null}
                    </Text>
                  ))}
                </View>
              ) : (
                <Text>—</Text>
              ),
          }}
          right={{
            labelKey: "sections.sun_sign",
            children:
              suryaRashi?.name_ne || suryaRashi?.name ? (
                <Text className="font-semibold">
                  {formatRashiDisplay(suryaRashi.name_ne, suryaRashi.name, lang)}
                </Text>
              ) : (
                <Text>—</Text>
              ),
          }}
        />
        <PanchangaQuadRow
          left={{
            labelKey: "sections.sun_nakshatra",
            children:
              suryaNak?.name_ne || suryaNak?.name ? (
                <Text className="font-semibold">
                  {pick(suryaNak.name_ne ?? suryaNak.name ?? "—", suryaNak.name ?? suryaNak.name_ne ?? "—")}
                </Text>
              ) : (
                <Text>—</Text>
              ),
          }}
          right={{
            labelKey: "sections.pada",
            children:
              padaSpans && padaSpans.length > 0 ? (
                <Text className="text-sm">
                  {digits(padaSpans.length)} {t("sections.pada_transitions")}
                </Text>
              ) : (
                <Text>—</Text>
              ),
          }}
        />
      </PanchangaTableBody>
      {padaSpans && padaSpans.length > 0 ? (
        <PanchangaSubBlock title={t("sections.pada_detail")}>
          <PadaDetailGrid padaSpans={padaSpans} t={t} pick={pick} digits={digits} />
        </PanchangaSubBlock>
      ) : null}
    </PanchangaSection>
  );
}

function BalamChips({ items }: { items: BalamChip[] }) {
  const { lang } = useLocale();
  return (
    <View className="mb-2.5 flex flex-wrap gap-1.5">
      {items.map((it, i) => (
        <Text
          key={`${it.name_ne ?? it.name}-${i}`}
          className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-1.5 text-sm font-semibold leading-none shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)]"
        >
          <Text>{formatRashiDisplay(it.name_ne, it.name, lang)}</Text>
        </Text>
      ))}
    </View>
  );
}

const splitPanelHeading =
  "mb-2 text-sm font-semibold uppercase tracking-wide text-foreground";

function PadaDetailGrid({
  padaSpans,
  t,
  pick,
  digits,
}: {
  padaSpans: NonNullable<ReturnType<typeof getNakshatraPadaSpans>>;
  t: (key: string) => string;
  pick: (ne: string, en: string) => string;
  digits: (v: string | number) => string;
}) {
  const wide = usePanchangaLayoutWide();
  const mid = Math.ceil(padaSpans.length / 2);
  const cols = wide
    ? [padaSpans.slice(0, mid), padaSpans.slice(mid)]
    : [padaSpans];

  return (
    <View className={wide ? "flex-row gap-3" : "gap-3"}>
      {cols.map((slice, col) => {
        if (!slice.length) return null;
        return (
          <View key={`pada-col-${col}`} className={wide ? "min-w-0 flex-1" : "w-full"}>
            <DenseListTable>
              {slice.map((span, i) => {
                const nakName = pick(
                  span.nakshatra_name_ne ?? span.nakshatra_name ?? "",
                  span.nakshatra_name ?? span.nakshatra_name_ne ?? "",
                );
                const padaLabel = pick(
                  span.pada_ne ?? digits(span.pada ?? ""),
                  String(span.pada ?? span.pada_ne ?? ""),
                );
                return (
                  <DenseListRow
                    key={`pada-${col}-${i}`}
                    label={
                      nakName ? `${nakName} — ${padaLabel} ${t("sections.pada_unit")}` : "—"
                    }
                    time={
                      formatSpanEndTime(span)
                        ? `${formatSpanEndTime(span)} ${t("sections.until")}`
                        : undefined
                    }
                  />
                );
              })}
            </DenseListTable>
          </View>
        );
      })}
    </View>
  );
}

export function BalamSection({ p }: { p: PanchangaDay }) {
  const { t } = useTranslation();
  const chandra = getChandrabalam(p);
  const tara = getTarabalam(p);
  const chandraTill = formatShortClock(chandra?.till?.end_local_time_short ?? chandra?.till?.end_local_time);
  const taraTill = formatShortClock(tara?.till?.end_local_time_short ?? tara?.till?.end_local_time);

  return (
    <PanchangaSection titleKey="sections.balam">
      <SectionSplitPanel
        left={
          <>
            <Text className={splitPanelHeading}>
              {t("sections.auspicious_chandra")}
              {chandraTill ? (
                <>
                  {" "}
                  — <Text className="font-mono normal-case">{chandraTill}</Text> {t("sections.until")}
                </>
              ) : null}
            </Text>
            <BalamChips items={chandra?.set1 ?? []} />
            <Text className={cn(splitPanelHeading, "mt-3")}>{t("sections.until_sunrise")}</Text>
            <BalamChips items={chandra?.set2 ?? []} />
          </>
        }
        right={
          <>
            <Text className={splitPanelHeading}>
              {t("sections.auspicious_tara")}
              {taraTill ? (
                <>
                  {" "}
                  — <Text className="font-mono normal-case">{taraTill}</Text> {t("sections.until")}
                </>
              ) : null}
            </Text>
            <BalamChips items={tara?.set1 ?? []} />
            <Text className={cn(splitPanelHeading, "mt-3")}>{t("sections.until_sunrise")}</Text>
            <BalamChips items={tara?.set2 ?? []} />
          </>
        }
      />
    </PanchangaSection>
  );
}

export function PanchakaLagnaSection({ p }: { p: PanchangaDay }) {
  const { t } = useTranslation();
  const { pick, lang } = useLocale();
  const panchaka = getPanchakaRahita(p) ?? [];
  const lagna = getUdayaLagna(p) ?? [];
  const rowCount = Math.max(panchaka.length, lagna.length);

  if (!rowCount) return null;

  const rows = Array.from({ length: rowCount }, (_, i) => {
    const pr = panchaka[i];
    const lg = lagna[i];
    return {
      left: pr
        ? {
            label: pick(pr.name_ne ?? pr.name ?? "—", pr.name ?? pr.name_ne ?? "—"),
            time:
              formatTimeRangeShort(
                pr.start_local_time_short ?? pr.start_local_time,
                pr.end_local_time_short ?? pr.end_local_time,
              ) ?? undefined,
            highlight: pr.good,
          }
        : undefined,
      right: lg
        ? {
            label: formatRashiDisplay(lg.name_ne, lg.name, lang) ?? "—",
            time:
              formatTimeRangeShort(
                lg.start_local_time_short ?? lg.start_local_time,
                lg.end_local_time_short ?? lg.end_local_time,
              ) ?? undefined,
            note: lg.pushkara_navamsha?.length
              ? `${t("sections.pushkara")}: ${lg.pushkara_navamsha
                  .map((h) => formatShortClock(h.local_time_short ?? h.local_time))
                  .filter(Boolean)
                  .join(", ")}`
              : undefined,
          }
        : undefined,
    };
  });

  return (
    <PanchangaSection titleKey="sections.panchaka_lagna">
      <PairedTimingTable
        leftTitle={t("sections.today_panchaka")}
        rightTitle={t("sections.today_udaya_lagna")}
        rows={rows}
      />
    </PanchangaSection>
  );
}

function DualValueDisplay({
  pauranikLabel,
  vedicLabel,
  differs,
}: {
  pauranikLabel?: string;
  vedicLabel?: string;
  differs?: boolean;
}) {
  const showStrike =
    differs ??
    (pauranikLabel != null && vedicLabel != null && pauranikLabel !== vedicLabel);

  if (!pauranikLabel && !vedicLabel) {
    return <Text>—</Text>;
  }

  return (
    <View className="flex flex-col gap-0.5">
      {showStrike && pauranikLabel ? (
        <Text className="line-through text-base">{pauranikLabel}</Text>
      ) : null}
      <Text className="font-semibold">{vedicLabel ?? pauranikLabel}</Text>
    </View>
  );
}

export function RituSection({ p }: { p: PanchangaDay }) {
  const { lang } = useLocale();
  const rituPauranik = getRituPauranik(p);
  const rituVedic = getRituVedic(p);
  const aayanPauranik = getAayanPauranik(p);
  const aayanVedic = getAayanVedic(p);

  return (
    <PanchangaSection titleKey="sections.ritu_ayana">
      <PanchangaTableBody>
        <PanchangaQuadRow
          left={{
            labelKey: "sections.ritu",
            children: (
              <DualValueDisplay
                pauranikLabel={formatRituLabel(rituPauranik, lang)}
                vedicLabel={formatRituLabel(rituVedic, lang)}
                differs={rituPauranik?.name !== rituVedic?.name}
              />
            ),
          }}
          right={{
            labelKey: "sections.ayana",
            children: (
              <DualValueDisplay
                pauranikLabel={formatAayanLabel(aayanPauranik, lang)}
                vedicLabel={formatAayanLabel(aayanVedic, lang)}
                differs={aayanPauranik?.name !== aayanVedic?.name}
              />
            ),
          }}
        />
        <PanchangaQuadRow
          left={{
            labelKey: "sections.dinamana",
            children: (
              <Text className="font-mono font-semibold">
                {formatDurationFull(p, "dinamaan", lang) ?? "—"}
              </Text>
            ),
          }}
          right={{
            labelKey: "sections.ratrimana",
            children: (
              <Text className="font-mono font-semibold">
                {formatDurationFull(p, "ratrimana", lang) ?? "—"}
              </Text>
            ),
          }}
        />
        <PanchangaQuadRow
          left={{
            labelKey: "sections.madhyahna",
            children: (
              <Text className="font-mono font-semibold">
                {formatMadhyahnaDisplay(p, lang) ?? "—"}
              </Text>
            ),
          }}
        />
      </PanchangaTableBody>
    </PanchangaSection>
  );
}

function MuhurtaTimingValue({
  value,
  variant,
}: {
  value: string;
  variant: "good" | "bad";
}) {
  const lines = value.split("\n").filter(Boolean);
  if (lines.length === 1 && lines[0].includes(" – ") && !lines[0].includes("सम्म")) {
    const [start, end] = lines[0].split(" – ");
    return (
      <TimingRange
        start={start}
        end={end?.split(" (")[0]}
        variant={variant}
      />
    );
  }
  return (
    <View
      className={
        variant === "good"
          ? "flex flex-col gap-1 text-emerald-800 dark:text-emerald-300"
          : "flex flex-col gap-1 text-rose-800 dark:text-rose-300"
      }
    >
      {lines.map((line) => (
        <Text key={line} className="text-sm text-base leading-snug">
          {line}
        </Text>
      ))}
    </View>
  );
}

export function MuhurtaTimingsSection({ p }: { p: PanchangaDay }) {
  const { t } = useTranslation();
  const { lang } = useLocale();
  const rows = getMuhurtaRows(p, lang);
  const good = rows.filter((r) => r.auspicious);
  const bad = rows.filter((r) => !r.auspicious);

  if (!rows.length) return null;

  if (good.length > 0 && bad.length > 0) {
    return (
      <PanchangaSection titleKey="sections.muhurta_timings">
        <SectionSplitPanel
          left={
            <>
              <Text className={splitPanelHeading}>{t("sections.auspicious_timings")}</Text>
              <PanchangaTableBody>
                {good.map((row) => (
                  <PanchangaFullRow key={row.label} label={row.label}>
                    <MuhurtaTimingValue value={row.value} variant="good" />
                  </PanchangaFullRow>
                ))}
              </PanchangaTableBody>
            </>
          }
          right={
            <>
              <Text className={splitPanelHeading}>{t("sections.inauspicious_timings")}</Text>
              <PanchangaTableBody>
                {bad.map((row) => (
                  <PanchangaFullRow key={row.label} label={row.label}>
                    <MuhurtaTimingValue value={row.value} variant="bad" />
                  </PanchangaFullRow>
                ))}
              </PanchangaTableBody>
            </>
          }
        />
      </PanchangaSection>
    );
  }

  return (
    <>
      {good.length > 0 && (
        <PanchangaSection titleKey="sections.auspicious_timings">
          <PanchangaTableBody>
            {good.map((row) => (
              <PanchangaFullRow key={row.label} label={row.label}>
                <MuhurtaTimingValue value={row.value} variant="good" />
              </PanchangaFullRow>
            ))}
          </PanchangaTableBody>
        </PanchangaSection>
      )}
      {bad.length > 0 && (
        <PanchangaSection titleKey="sections.inauspicious_timings">
          <PanchangaTableBody>
            {bad.map((row) => (
              <PanchangaFullRow key={row.label} label={row.label}>
                <MuhurtaTimingValue value={row.value} variant="bad" />
              </PanchangaFullRow>
            ))}
          </PanchangaTableBody>
        </PanchangaSection>
      )}
    </>
  );
}

function NivasDirectionValue({
  segment,
}: {
  segment?: NivasShoolSegment | null;
}) {
  const { pick } = useLocale();
  if (!segment) return <Text>—</Text>;
  const name = pick(segment.name_ne ?? segment.name_en ?? "—", segment.name_en ?? segment.name_ne ?? "—");
  return <Text className="font-semibold">{name}</Text>;
}

function NivasTimedSegments({
  segments,
  showSubtitle = false,
  showGuna = false,
}: {
  segments?: NivasShoolSegment[];
  showSubtitle?: boolean;
  showGuna?: boolean;
}) {
  const { t } = useTranslation();
  const { pick } = useLocale();
  if (!segments?.length) return <Text>—</Text>;

  return (
    <View className="flex flex-col gap-1 min-w-0">
      {segments.map((seg, idx) => {
        const name = pick(seg.name_ne ?? seg.name_en ?? "—", seg.name_en ?? seg.name_ne ?? "—");
        const subtitle = showSubtitle
          ? pick(seg.subtitle_ne ?? seg.subtitle_en ?? "", seg.subtitle_en ?? seg.subtitle_ne ?? "")
          : "";
        const endTime = seg.end_local_time_short
          ? toNepaliDigits(formatTimeShort(seg.end_local_time_short) ?? seg.end_local_time_short)
          : undefined;
        const gunaLabel =
          showGuna && seg.is_auspicious !== undefined
            ? seg.is_auspicious
              ? t("sections.nivas_auspicious")
              : t("sections.nivas_inauspicious")
            : undefined;
        const fromTime = seg.start_local_time_short
          ? toNepaliDigits(formatTimeShort(seg.start_local_time_short) ?? seg.start_local_time_short)
          : undefined;

        return (
          <View key={`${name}-${idx}`} className="min-w-0">
            {fromTime && !endTime ? (
              <Text className="font-semibold">
                {subtitle ? `${name} (${subtitle})` : name}
                {" "}
                <Text className="text-sm font-mono font-semibold text-foreground">
                  {t("sections.nivas_from")} {fromTime} {t("sections.nivas_to_full_night")}
                </Text>
              </Text>
            ) : (
              <UptoValue
                name={subtitle ? `${name} (${subtitle})` : name}
                endTime={endTime}
                badge={gunaLabel}
              />
            )}
            {seg.until_full_night && idx === segments.length - 1 && segments.length > 1 && !endTime ? (
              <Text className="text-sm font-mono font-semibold text-foreground">
                {t("sections.nivas_to_full_night")}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export function NivasShoolSection({
  p,
  fallback,
}: {
  p: PanchangaDay;
  fallback?: PanchangaDay | null;
}) {
  const ns = getNivasShool(p) ?? (fallback ? getNivasShool(fallback) : undefined);
  if (!ns) return null;

  const disha = ns.disha_shool;
  const rahu = ns.rahu_vasa;

  return (
    <PanchangaSection titleKey="sections.nivas_shool">
      <PanchangaTableBody>
        <PanchangaQuadRow
          left={{
            labelKey: "sections.homahuti",
            children: (
              <NivasTimedSegments
                segments={ns.homahuti?.segments}
              />
            ),
          }}
          right={{
            labelKey: "sections.disha_shool",
            children: <NivasDirectionValue segment={disha} />,
          }}
        />
        <PanchangaQuadRow
          left={{
            labelKey: "sections.rahu_vasa",
            children: <NivasDirectionValue segment={rahu} />,
          }}
          right={{
            labelKey: "sections.agnivasa",
            children: (
              <NivasTimedSegments
                segments={ns.agnivasa?.segments}
                showSubtitle
              />
            ),
          }}
        />
        <PanchangaQuadRow
          left={{
            labelKey: "sections.chandra_vasa",
            children: (
              <NivasTimedSegments segments={ns.chandra_vasa?.segments} />
            ),
          }}
          right={{
            labelKey: "sections.shivavasa",
            children: (
              <NivasTimedSegments segments={ns.shivavasa?.segments} />
            ),
          }}
        />
        {ns.bhadravasa?.active ? (
          <PanchangaQuadRow
            left={{
              labelKey: "sections.bhadravasa",
              children: (
                <NivasTimedSegments
                  segments={ns.bhadravasa.segments}
                  showSubtitle
                />
              ),
            }}
            right={{
              labelKey: "sections.kumbha_chakra",
              children: (
                <NivasTimedSegments
                  segments={ns.kumbha_chakra?.segments}
                  showGuna
                />
              ),
            }}
          />
        ) : (
          <PanchangaQuadRow
            left={{
              labelKey: "sections.kumbha_chakra",
              children: (
                <NivasTimedSegments
                  segments={ns.kumbha_chakra?.segments}
                  showGuna
                />
              ),
            }}
          />
        )}
      </PanchangaTableBody>
    </PanchangaSection>
  );
}

export function DinVisheshSection({ p }: { p: PanchangaDay }) {
  const { lang } = useLocale();
  const labels = getDinVisheshLabels(p, [], lang);
  if (!labels.length) return null;

  return (
    <PanchangaSection titleKey="sections.special_observances">
      <View className="px-4 py-3 flex flex-wrap gap-2">
        {labels.map((label) => (
          <Text
            key={label}
            className="text-sm font-semibold px-2.5 py-1.5 rounded-full bg-secondary/12 text-secondary dark:text-accent border border-secondary/20"
          >
            {label}
          </Text>
        ))}
      </View>
    </PanchangaSection>
  );
}

export function PlanetsPanel({ p }: { p: PanchangaDay }) {
  const { t } = useTranslation();
  const { lang, pick } = useLocale();
  const planets = getPlanetRows(p);
  const lagna = getLagnaDisplay(p);
  if (!planets.length && !lagna) return null;

  return (
    <View className="rounded-xl bg-card p-4 shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)]">
      <View className="flex items-baseline gap-2 mb-2">
        <Text className="text-base font-bold m-0">{t("sections.planet_positions")}</Text>
        <Text className="text-sm">{getPlanetsAnchorLabel(p, lang)}</Text>
      </View>
      <View className="flex flex-col">
        {lagna && (
          <View className="flex items-center gap-3 py-2 border-b border-border">
            <Text className="w-8 h-8 rounded-lg flex items-center justify-center text-base bg-secondary/11 text-secondary dark:text-accent shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)]">
              {pick("लग्न", "ASC")}
            </Text>
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-semibold">{t("sections.lagna")}</Text>
              <Text className="text-sm">
                {formatRashiDisplay(lagna.nameNe, undefined, lang) ?? lagna.nameNe}
              </Text>
            </View>
            {lagna.degree && (
              <Text className="font-mono text-sm font-semibold text-foreground whitespace-nowrap">
                {lagna.degree}°
              </Text>
            )}
          </View>
        )}
        {planets.map(({ key, label, labelEn, rashiNe, rashiEn, coords }) => (
          <View
            key={key}
            className="flex items-center gap-3 py-2 border-b border-border last:border-0"
          >
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-semibold">{pick(label, labelEn)}</Text>
              {(rashiNe || rashiEn) ? (
                <Text className="text-sm">
                  {formatRashiDisplay(rashiNe, rashiEn, lang) ?? pick(rashiNe ?? "", rashiEn ?? "")}
                </Text>
              ) : null}
            </View>
            <Text className="font-mono text-sm font-semibold text-foreground whitespace-nowrap">
              {coords}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function FestivalsSection({ p }: { p: PanchangaDay }) {
  const { pick } = useLocale();
  const festivals = p.festivals ?? [];
  if (!festivals.length) return null;

  return (
    <PanchangaSection titleKey="sections.festivals">
      <View className="px-4 py-3 flex flex-wrap gap-2">
        {festivals.map((f) => (
          <Text
            key={f.id}
            className={
              f.is_public_holiday
                ? "text-sm font-semibold px-2.5 py-1.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20"
                : "text-sm font-semibold px-2.5 py-1.5 rounded-full bg-secondary/12 text-secondary dark:text-accent border border-secondary/20"
            }
          >
            {pick(f.name_ne ?? f.name ?? "", f.name_en ?? f.name ?? f.name_ne ?? "")}
          </Text>
        ))}
      </View>
    </PanchangaSection>
  );
}
