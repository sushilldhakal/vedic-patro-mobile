const NE_DIGITS = "०१२३४५६७८९";

export function toAsciiDigits(s: string): string {
  return s.replace(/[०-९]/g, (c) => String(NE_DIGITS.indexOf(c)));
}

function consumeUnit(
  digits: string,
  min: number,
  max: number,
): { text: string; used: number; complete: boolean } {
  if (digits.length === 0) return { text: "", used: 0, complete: false };
  const first = Number(digits[0]);
  const canStartTwoDigit = first === 0 || first * 10 <= max;

  if (digits.length === 1) {
    if (canStartTwoDigit) return { text: digits, used: 1, complete: false };
    return { text: `0${digits}`, used: 1, complete: true };
  }

  const two = digits.slice(0, 2);
  const value = Number(two);
  if (canStartTwoDigit && value >= min && value <= max) {
    return { text: two, used: 2, complete: true };
  }
  return { text: `0${digits[0]}`, used: 1, complete: true };
}

/** Mask birth date as YYYY-MM-DD while typing. */
export function formatDateInput(raw: string): string {
  const digits = toAsciiDigits(raw).replace(/\D/g, "").slice(0, 8);
  if (digits.length === 0) return "";

  const year = digits.slice(0, 4);
  if (digits.length <= 4) return year;

  const monthDigits = digits.slice(4);
  const month = consumeUnit(monthDigits, 1, 12);
  const monthPart = `${year}-${month.text}`;
  if (!month.complete) return monthPart;

  const dayDigits = monthDigits.slice(month.used);
  const day = consumeUnit(dayDigits, 1, 31);
  return day.text ? `${monthPart}-${day.text}` : monthPart;
}

/** Mask birth time as HH:MM while typing. */
export function formatTimeInput(raw: string): string {
  const digits = toAsciiDigits(raw).replace(/\D/g, "").slice(0, 4);
  if (digits.length === 0) return "";

  const hour = consumeUnit(digits, 0, 23);
  if (!hour.complete) return hour.text;

  const minDigits = digits.slice(hour.used);
  const minute = consumeUnit(minDigits, 0, 59);
  return minute.text ? `${hour.text}:${minute.text}` : hour.text;
}

export function parseBirthDateParts(raw: string): { y: number; m: number; d: number } | null {
  const s = toAsciiDigits(raw).trim();
  const m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (y < 1800 || y > 2200 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}
