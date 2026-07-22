export type SaitCategoryId =
  | "vivah"
  | "bratabandha"
  | "griha-aarambha"
  | "griha-pravesh"
  | "byaparik-pratisthan"
  | "rudri-jurne"
  | "agni-jurne"
  | "annaprasan";

export const SAIT_CATEGORIES: { id: SaitCategoryId; label: string }[] = [
  { id: "vivah", label: "विवाह" },
  { id: "bratabandha", label: "ब्रतबन्ध" },
  { id: "griha-aarambha", label: "गृह आराम्भ" },
  { id: "griha-pravesh", label: "गृह प्रवेश" },
  { id: "byaparik-pratisthan", label: "व्यापारिक प्रतिष्ठान" },
  { id: "rudri-jurne", label: "रुद्री जुर्ने" },
  { id: "agni-jurne", label: "अग्नि जुर्ने" },
  { id: "annaprasan", label: "अन्नप्रासन" },
];

export const SAIT_CATEGORY_LABELS: Record<SaitCategoryId, { ne: string; en: string }> = {
  vivah: { ne: "विवाह", en: "Vivah" },
  bratabandha: { ne: "ब्रतबन्ध", en: "Bratabandha" },
  "griha-aarambha": { ne: "गृह आराम्भ", en: "Griha Aarambha" },
  "griha-pravesh": { ne: "गृह प्रवेश", en: "Griha Pravesh" },
  "byaparik-pratisthan": { ne: "व्यापारिक प्रतिष्ठान", en: "Business inauguration" },
  "rudri-jurne": { ne: "रुद्री जुर्ने", en: "Rudri jurne" },
  "agni-jurne": { ne: "अग्नि जुर्ने", en: "Agni jurne" },
  annaprasan: { ne: "अन्नप्रासन", en: "Annaprasan" },
};
