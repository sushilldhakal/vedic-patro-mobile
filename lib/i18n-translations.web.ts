import { useCallback } from "react";
import { useLocale } from "@/lib/i18n";

const STRINGS: Record<string, [string, string]> = {
  "calendar.day_aria": ["दिन", "Day"],
  "calendar.today_btn": ["आज", "Today"],
  "calendar.month_aria": ["महिना", "Month"],
  "calendar.year_aria": ["वर्ष", "Year"],
  "calendar.prev_day": ["अघिल्लो दिन", "Previous day"],
  "calendar.next_day": ["अर्को दिन", "Next day"],
  "panchanga.hour_aria": ["घण्टा", "Hour"],
  "panchanga.minute_aria": ["मिनेट", "Minute"],
  "panchanga.year_link": ["वर्ष पञ्चाङ्ग", "Year panchanga"],
  "panchanga.error_load": ["पञ्चाङ्ग लोड गर्न सकिएन।", "Could not load panchanga."],
  "panchanga_year.pause": ["रोक्नुहोस्", "Pause"],
  "panchanga_year.play": ["चलाउनुहोस्", "Play"],
  "panchanga_year.play_title": ["अगाडि चलाउनुहोस्", "Play forward"],
  "sections.until": ["सम्म", "until"],
  "sections.dash": ["—", "—"],
  "sections.not_available": ["उपलब्ध छैन", "Not available"],
  "sections.pada_transitions": ["पद संक्रमण", "pada transitions"],
  "sections.pada_detail": ["पद विवरण", "Pada detail"],
  "sections.pada_unit": ["पद", "pada"],
  "sections.auspicious_chandra": ["शुभ चन्द्र", "Auspicious Moon"],
  "sections.until_sunrise": ["सूर्योदयसम्म", "Until sunrise"],
  "sections.auspicious_tara": ["शुभ तारा", "Auspicious Tara"],
  "sections.pushkara": ["पुष्कर", "Pushkara"],
  "sections.today_panchaka": ["आजको पञ्चक", "Today's Panchaka"],
  "sections.today_udaya_lagna": ["आजको उदय लग्न", "Today's rising signs"],
  "sections.auspicious_timings": ["शुभ समय", "Auspicious timings"],
  "sections.inauspicious_timings": ["अशुभ समय", "Inauspicious timings"],
  "sections.nivas_auspicious": ["शुभ", "Auspicious"],
  "sections.nivas_inauspicious": ["अशुभ", "Inauspicious"],
  "sections.nivas_from": ["बाट", "from"],
  "sections.nivas_to_full_night": ["रातभरि", "through the night"],
  "sections.planet_positions": ["ग्रह स्थिति", "Planet positions"],
  "sections.lagna": ["लग्न", "Lagna"],
};

/** Web-only shim for react-i18next useTranslation in ported patro components. */
export function useTranslation() {
  const { pick } = useLocale();
  const t = useCallback(
    (key: string) => {
      const pair = STRINGS[key];
      return pair ? pick(pair[0], pair[1]) : key;
    },
    [pick],
  );
  return { t, i18n: { language: "ne" } };
}
