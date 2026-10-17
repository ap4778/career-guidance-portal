export function formatRelativeDate(value) {
  const dateValue = typeof value === "string" ? value.replace(" ", "T") : value;
  const timestamp = new Date(dateValue).getTime();
  if (Number.isNaN(timestamp)) return "Recently posted";

  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86400000));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}
