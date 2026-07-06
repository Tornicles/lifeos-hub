export function toDateOnlyString(value: Date | string | null | undefined): string | null | undefined {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value;
  return value.toISOString().slice(0, 10);
}
