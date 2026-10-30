export function toMinutes(text: string): number {
  const parts = text.trim().split(":");
  const [hours, minutes] = parts.map((part) => part.trim());
  if (
    parts.length !== 2 ||
    !hours ||
    !minutes ||
    !/^\d+$/.test(hours) ||
    !/^\d+$/.test(minutes)
  ) {
    throw new Error(`hora inválida: "${text}" (se espera HH:MM)`);
  }
  const h = Number(hours);
  const m = Number(minutes);
  if (h >= 24 || m >= 60) throw new Error(`hora inválida: "${text}"`);
  return h * 60 + m;
}

export function toClock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
