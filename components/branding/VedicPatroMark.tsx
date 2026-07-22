import FaviconSvg from "@/assets/favicon.svg";

/** Official Vedic Patro mark — same SVG as web `public/favicon.svg`. */
export function VedicPatroMark({ size = 42 }: { size?: number }) {
  return <FaviconSvg width={size} height={size} accessibilityLabel="Vedic Patro" />;
}
