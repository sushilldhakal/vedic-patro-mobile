/** Web — load the official mark as an image (same as `<img src="/favicon.svg">`). */
export function VedicPatroMark({ size = 42 }: { size?: number }) {
  return (
    <img
      src="/favicon.svg"
      alt="Vedic Patro"
      width={size}
      height={size}
      style={{ display: "block", flexShrink: 0 }}
    />
  );
}
