import { useState } from "react";
import { getCurrentBs } from "@/lib/bs-calendar";
import { useLocale } from "@/lib/i18n";
import { defaultBrowseEraForLang, type PatroBrowseEra } from "@/lib/patro-era";

/** Shared year-browse state for yearly pages (suryakranti, holidays, …). */
export function usePatroYearBrowse(initialYear?: number) {
  const { lang } = useLocale();
  const [era, setEra] = useState<PatroBrowseEra>(() => defaultBrowseEraForLang(lang));
  const [year, setYear] = useState(initialYear ?? getCurrentBs().year);
  return { era, setEra, year, setYear };
}
