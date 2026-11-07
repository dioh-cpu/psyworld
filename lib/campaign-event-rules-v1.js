export function applyCampaignPercent(basePercent, eventPercent, maximumPercent) {
  const clamp = (value, max) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.min(max, number)) : 0;
  };
  const base = clamp(basePercent, maximumPercent);
  const event = clamp(eventPercent, 50);
  const combined = Math.min(maximumPercent, ((1 + base / 100) * (1 + event / 100) - 1) * 100);
  return Math.round(combined * 100) / 100;
}
