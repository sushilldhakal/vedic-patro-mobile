import type { Href } from "expo-router";

/** Deep link to a learn article — use string paths (web Expo Router drops `[slug]` params). */
export function hrefForLearnSlug(slug: string): Href {
  if (slug === "history") return "/learn/history";
  return `/learn/${slug}`;
}
