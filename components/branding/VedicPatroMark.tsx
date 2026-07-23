import FaviconSvg from "@/assets/favicon.svg";

/**
 * Native — bundled from `assets/favicon.svg` (single source of truth with web).
 * Metro/svg-transformer inlines the file at build time; no hand-drawn paths.
 */
export function VedicPatroMark({ size = 42 }: { size?: number }) {
  return <FaviconSvg width={size} height={size} accessibilityLabel="Vedic Patro" />;
}
