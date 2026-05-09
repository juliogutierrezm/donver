export function sanitizeIntegerInput(value: string) {
  return value.replace(/[^\d]/g, "");
}

export function parseIntegerInput(value: string, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}
