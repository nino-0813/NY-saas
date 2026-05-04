export function currentMonthIso(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export function formatMonthLabel(iso: string): string {
  const [y, m] = iso.split("-");
  return `${y}年${Number(m)}月`;
}
