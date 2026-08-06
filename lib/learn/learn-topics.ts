import type { ComponentType } from "react";
import {
  AdhikMaasArticle,
  AstronomyBasicsArticle,
  AyanamshaArticle,
  BsCalendarArticle,
  CalendarDifferencesArticle,
  EclipsesArticle,
  HoraArticle,
  KaranaArticle,
  NakshatraArticle,
  RituDriftArticle,
  SankrantiArticle,
  SolarSystemArticle,
  TithiArticle,
  TithiKshayaArticle,
  TithiVriddhiArticle,
  WhatIsPanchangArticle,
  YogaArticle,
} from "@/components/learn/articles/native-articles";
import { HowWeCalculateArticle } from "@/components/learn/articles/HowWeCalculateArticle";

const CONTENT_BY_SLUG: Record<string, ComponentType> = {
  "how-we-calculate": HowWeCalculateArticle,
  "astronomy-basics": AstronomyBasicsArticle,
  "solar-system": SolarSystemArticle,
  "bs-calendar": BsCalendarArticle,
  "calendar-differences": CalendarDifferencesArticle,
  "adhik-maas": AdhikMaasArticle,
  "ritu-drift": RituDriftArticle,
  "what-is-panchang": WhatIsPanchangArticle,
  tithi: TithiArticle,
  "tithi-vriddhi": TithiVriddhiArticle,
  "tithi-kshaya": TithiKshayaArticle,
  nakshatra: NakshatraArticle,
  yoga: YogaArticle,
  karana: KaranaArticle,
  sankranti: SankrantiArticle,
  hora: HoraArticle,
  eclipses: EclipsesArticle,
  ayanamsha: AyanamshaArticle,
};

export function getLearnArticleContent(slug: string): ComponentType | undefined {
  return CONTENT_BY_SLUG[slug];
}
