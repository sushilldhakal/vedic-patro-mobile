/**
 * Kundali copy aligned with web `src/i18n/{ne,en}.json` → `kundali.*`.
 * Keep in sync when web strings change.
 */
export const KUNDALI_I18N = {
  birth_panchanga: ["जन्म पञ्चाङ्ग", "Birth almanac"],
  tithi: ["तिथि", "Tithi"],
  nakshatra: ["नक्षत्र", "Nakshatra"],
  yoga: ["योग", "Yoga"],
  karana: ["करण", "Karana"],
  choghadiya: ["चौघडिया", "Choghadiya"],
  lagna: ["लग्न", "Lagna"],
  navamsha_lagna: ["नवांश लग्न", "Navamsha Lagna"],
  rashi_moon: ["राशि (चन्द्र)", "Rashi (Moon)"],
  sunrise: ["सूर्योदय", "Sunrise"],
  sunset: ["सूर्यास्त", "Sunset"],
  ishta_kala: ["इष्ट काल", "Ishta Kala"],
  ahoratri_ishta_kala: ["अहोरात्र इष्ट काल", "Ahoratri Ishta Kala"],
  sun_sign: ["सूर्य राशि", "Sun sign"],
  avakahada: ["अवकहडा", "Avakahada"],
  rashi_paya: ["राशि पाय", "Rashi Paya"],
  nakshatra_paya: ["नक्षत्र पाय", "Nakshatra Paya"],
  tattva: ["तत्त्व", "Tattva"],
  yunja: ["युञ्ज", "Yunja"],
  vashya: ["वश्य", "Vashya"],
  tara: ["तारा", "Tara"],
  akshara: ["अक्षर", "Akshara"],
  gana: ["गण", "Gana"],
  nadi: ["नाडी", "Nadi"],
  asana: ["आसन", "Asana"],
  yoni: ["योनी", "Yoni"],
  jati: ["जात", "Jati"],
  pada: ["पद", "Pada"],
  choghadiya_shubha: ["शुभ", "auspicious"],
  choghadiya_ashubha: ["अशुभ", "inauspicious"],
  choghadiya_samanya: ["सामान्य", "neutral"],
  weekday: ["वार", "Weekday"],
  ayana: ["अयन", "Ayana"],
  surya_nakshatra: ["सूर्य नक्षत्र", "Sun nakshatra"],
  nav_overview: ["जन्म पञ्चाङ्ग / कुण्डली चक्र", "Birth Almanac / Charts"],
  nav_graha_details: ["ग्रह विवरण", "Graha Details"],
  nav_yoga: ["कुण्डली योग", "Kundali Yoga"],
  yoga_reference_catalog: ["योग सन्दर्भ सूची (१६२ संयोग)", "Yoga reference catalog (162 combinations)"],
  yoga_reference_load_error: ["सन्दर्भ सूची लोड हुन सकेन।", "Could not load the reference catalog."],
  yoga_reference_no_match: ["कुनै मिल्ने संयोग भेटिएन।", "No matching combination."],
  yoga_reference_grouped_ids_note: [
    "स्रोतअनुसार समूह ID (जस्तै ३३–४४, ७५–१०६) यथावत् राखिएको छ।",
    "Grouped IDs (e.g. 33–44, 75–106) are kept as in the source.",
  ],
  loading: ["लोड हुँदै…", "Loading…"],
  dasha_begin: ["आरम्भ", "Begin"],
  dasha_end: ["अन्त", "End"],
  dasha_from: ["देखि", "From"],
  dasha_to: ["सम्म", "To"],
  dasha_maha: ["महादशा", "Maha Dasha"],
  dasha_running: ["चलिरहेको", "Running"],
  dasha_running_now: ["चलिरहेको दशा", "Running dasha"],
  dasha_total: ["कुल", "Total"],
  dasha_left: ["बाँकी", "Left"],
  mahadasha_at_birth: ["जन्मकालीन महादशा", "Mahadasha at birth"],
  dasha_balance: ["बाँकी अवधि", "Balance"],
  dasha_unavailable: ["दशा विवरण उपलब्ध छैन।", "Dasha details are not available."],
  nav_dasha: ["दशा", "Dasha"],
  nav_shadbala: ["षड्बल", "Shadbala"],
  nav_bhava_bala: ["भाव बल", "Bhava Bala"],
  nav_ashtakavarga: ["अष्टकवर्ग", "Ashtakavarga"],
  nav_vimshopaka: ["विंशोपक बल", "Vimshopaka Bala"],
  nav_shanti_vidhi: ["शान्ति विधि", "Shanti Vidhi"],
  nav_analysis: ["ज्योतिष विश्लेषण", "Astrological Analysis"],
} as const;

export type KundaliI18nKey = keyof typeof KUNDALI_I18N;

export function kundaliLabel(key: KundaliI18nKey, lang: "ne" | "en"): string {
  const pair = KUNDALI_I18N[key];
  return lang === "en" ? pair[1] : pair[0];
}

export function formatChoghadiyaAtBirth(
  lang: "ne" | "en",
  row: { nameNe: string; nameEn?: string; quality: string },
): string {
  const name = lang === "en" ? row.nameEn ?? row.nameNe : row.nameNe;
  let qualityLabel = row.quality;
  if (row.quality === "शुभ") qualityLabel = kundaliLabel("choghadiya_shubha", lang);
  else if (row.quality === "अशुभ") qualityLabel = kundaliLabel("choghadiya_ashubha", lang);
  else if (row.quality === "सामान्य") qualityLabel = kundaliLabel("choghadiya_samanya", lang);
  return `${name} (${qualityLabel})`;
}
