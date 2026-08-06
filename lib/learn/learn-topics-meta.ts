export interface LearnCategory {
  id: string;
  ne: string;
  en: string;
}

export interface LearnTopicMeta {
  slug: string;
  category: string;
  titleNe: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  icon: string;
}

export const LEARN_CATEGORIES: LearnCategory[] = [
  { id: "history", ne: "इतिहास · सम्पदा", en: "History · heritage" },
  { id: "astronomy", ne: "खगोल आधार", en: "Astronomy" },
  { id: "calendars", ne: "पात्रो", en: "Calendars" },
  { id: "panchanga", ne: "पञ्चाङ्ग", en: "Panchanga" },
  { id: "eclipses", ne: "ग्रहण", en: "Eclipses" },
  { id: "kundali", ne: "कुण्डली", en: "Kundali" },
];

export const LEARN_TOPIC_METAS: LearnTopicMeta[] = [
  {
    slug: "history",
    category: "history",
    titleNe: "मयासुरको सूर्य सिद्धान्त",
    titleEn: "Mayasura's Surya Siddhanta",
    icon: "time-outline",
    summary: "नेपाली पात्रोको खगोलीय जग — सूर्य सिद्धान्तको इतिहास।",
    summaryEn: "Astronomical roots of the Nepali patro.",
  },
  {
    slug: "how-we-calculate",
    category: "history",
    titleNe: "हामी यो कसरी गणना गर्छौं",
    titleEn: "How We Calculate It",
    icon: "server-outline",
    summary: "API pipeline र Swiss Ephemeris — अन्तरक्रियात्मक चित्र।",
    summaryEn: "API pipeline and ephemeris — with diagrams.",
  },
  {
    slug: "astronomy-basics",
    category: "astronomy",
    titleNe: "खगोलीय आधार",
    titleEn: "Sky basics",
    icon: "eye-outline",
    summary: "१२ राशि, ९ ग्रह, २७ नक्षत्र — पूर्व तयारी।",
    summaryEn: "Rashis, grahas, nakshatras — primer.",
  },
  {
    slug: "solar-system",
    category: "astronomy",
    titleNe: "सौर्यमण्डल",
    titleEn: "Solar system",
    icon: "planet-outline",
    summary: "पृथ्वी र चन्द्रको गति।",
    summaryEn: "Earth and Moon motion.",
  },
  {
    slug: "bs-calendar",
    category: "calendars",
    titleNe: "विक्रम सम्वत्",
    titleEn: "BS calendar",
    icon: "calendar-outline",
    summary: "सौर vs चान्द्र महिना।",
    summaryEn: "Solar vs lunar months.",
  },
  {
    slug: "calendar-differences",
    category: "calendars",
    titleNe: "पात्रो भिन्नता",
    titleEn: "Calendar differences",
    icon: "globe-outline",
    summary: "नेपाली, भारतीय, ग्रेगोरियन।",
    summaryEn: "Nepali, Indian, Gregorian.",
  },
  {
    slug: "adhik-maas",
    category: "calendars",
    titleNe: "अधिक मास",
    titleEn: "Adhik maas",
    icon: "layers-outline",
    summary: "थपिने महिना किन?",
    summaryEn: "Why an extra month appears.",
  },
  {
    slug: "ritu-drift",
    category: "calendars",
    titleNe: "ऋतु सर्ने",
    titleEn: "Ṛtu drift",
    icon: "leaf-outline",
    summary: "सायन vs निरयन।",
    summaryEn: "Tropical vs sidereal seasons.",
  },
  {
    slug: "what-is-panchang",
    category: "panchanga",
    titleNe: "पञ्चाङ्ग के हो?",
    titleEn: "What is panchang?",
    icon: "book-outline",
    summary: "पाँच अङ्गको परिचय।",
    summaryEn: "Five limbs of panchanga.",
  },
  {
    slug: "tithi",
    category: "panchanga",
    titleNe: "तिथि",
    titleEn: "Tithi",
    icon: "moon-outline",
    summary: "१२° कोण र तिथि।",
    summaryEn: "12° arc and tithi.",
  },
  {
    slug: "tithi-vriddhi",
    category: "panchanga",
    titleNe: "तिथि वृद्धि",
    titleEn: "Tithi vriddhi",
    icon: "add-circle-outline",
    summary: "तिथि दोहोरिने।",
    summaryEn: "When tithi repeats.",
  },
  {
    slug: "tithi-kshaya",
    category: "panchanga",
    titleNe: "तिथि क्षय",
    titleEn: "Tithi kshaya",
    icon: "remove-circle-outline",
    summary: "तिथि हराउने।",
    summaryEn: "When tithi skips.",
  },
  {
    slug: "nakshatra",
    category: "panchanga",
    titleNe: "नक्षत्र",
    titleEn: "Nakshatra",
    icon: "star-outline",
    summary: "२७ नक्षत्र।",
    summaryEn: "27 nakshatras.",
  },
  {
    slug: "yoga",
    category: "panchanga",
    titleNe: "योग",
    titleEn: "Yoga",
    icon: "infinite-outline",
    summary: "२७ योग।",
    summaryEn: "27 yogas.",
  },
  {
    slug: "karana",
    category: "panchanga",
    titleNe: "करण",
    titleEn: "Karana",
    icon: "cut-outline",
    summary: "११ करण।",
    summaryEn: "11 karanas.",
  },
  {
    slug: "sankranti",
    category: "panchanga",
    titleNe: "सङ्क्रान्ति",
    titleEn: "Sankranti",
    icon: "sunny-outline",
    summary: "सूर्य राशि परिवर्तन।",
    summaryEn: "Sun sign ingress.",
  },
  {
    slug: "hora",
    category: "panchanga",
    titleNe: "होरा",
    titleEn: "Hora",
    icon: "time-outline",
    summary: "ग्रहीय होरा।",
    summaryEn: "Planetary hora.",
  },
  {
    slug: "eclipses",
    category: "eclipses",
    titleNe: "ग्रहण",
    titleEn: "Eclipses",
    icon: "ellipse-outline",
    summary: "सूर्य र चन्द्र ग्रहण।",
    summaryEn: "Solar & lunar eclipses.",
  },
  {
    slug: "ayanamsha",
    category: "kundali",
    titleNe: "अयनांश",
    titleEn: "Ayanamsha",
    icon: "compass-outline",
    summary: "लाहिरी, रामन, KP।",
    summaryEn: "Lahiri, Raman, KP.",
  },
];

export function topicsInCategory(categoryId: string): LearnTopicMeta[] {
  return LEARN_TOPIC_METAS.filter((t) => t.category === categoryId);
}

export function adjacentTopicMetas(slug: string): {
  prev: LearnTopicMeta | null;
  next: LearnTopicMeta | null;
} {
  const i = LEARN_TOPIC_METAS.findIndex((t) => t.slug === slug);
  return {
    prev: i > 0 ? LEARN_TOPIC_METAS[i - 1]! : null,
    next: i >= 0 && i < LEARN_TOPIC_METAS.length - 1 ? LEARN_TOPIC_METAS[i + 1]! : null,
  };
}

export const LEARN_SLUGS = new Set(LEARN_TOPIC_METAS.map((t) => t.slug));
