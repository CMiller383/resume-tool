const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatMonthYear(value: string) {
  if (!value) return "";
  if (/present/i.test(value)) return "Present";
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!match) return value;
  const year = match[1];
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return value;
  return `${MONTHS[monthIndex]} ${year}`;
}

export function formatDateRange(start: string, end: string) {
  const left = formatMonthYear(start);
  const right = formatMonthYear(end);
  if (!left && !right) return "";
  if (left && right) return `${left} - ${right}`;
  return left || right;
}

export function normalizeUrl(value: string) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

