export const MAX_EVENTS = 20;
const day = (value) => typeof value === "string" && (value === "" || (/^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value));
export function validEventUrl(value) {
  if (typeof value !== "string" || value.length > 500) return false;
  if (!value) return true;
  if (/^tel:\+?[\d ()-]{5,30}$/.test(value)) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}
export function parseEvents(value) {
  if (!Array.isArray(value) || value.length > MAX_EVENTS) return null;
  const ids = new Set(), result = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const e = item;
    if (typeof e.id !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(e.id) || ids.has(e.id) || typeof e.active !== "boolean") return null;
    for (const [key, max] of [["title", 120], ["description", 2000], ["buttonLabel", 60]]) if (typeof e[key] !== "string" || e[key].length > max) return null;
    if (!(e.title).trim() || !day(e.date) || !day(e.expiresOn) || (e.date && e.expiresOn && e.expiresOn < e.date)) return null;
    if (typeof e.imageSrc !== "string" || (e.imageSrc !== "" && !/^\/media\/[a-f0-9]{64}\.(webp|jpg|png)$/.test(e.imageSrc))) return null;
    if (!validEventUrl(e.buttonUrl) || Boolean(e.buttonUrl) !== Boolean((e.buttonLabel).trim())) return null;
    ids.add(e.id);
    result.push({ id: e.id, title: (e.title).trim(), description: (e.description).trim(), date: e.date, expiresOn: e.expiresOn, imageSrc: e.imageSrc, buttonLabel: (e.buttonLabel).trim(), buttonUrl: e.buttonUrl, active: e.active });
  }
  return result;
}
// Dates are restaurant calendar dates: expiry includes the entire selected day in Madrid.
export function madridDay(now) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  return ["year", "month", "day"].map(type => parts.find(p => p.type === type).value).join("-");
}
export function sortEvents(events) {
  return [...events].sort((a, b) => {
    if (!a.date) return b.date ? 1 : 0;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });
}
export function activeEvents(events, now) {
  const today = madridDay(now);
  return sortEvents(events.filter(e => e.active && (!e.expiresOn || e.expiresOn >= today)));
}
export function eventDate(date, language = "es") {
  return date ? new Intl.DateTimeFormat(language, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)) : "";
}

export function parseSocials(value) {
  if (!value || typeof value !== "object") return null;
  const result = { instagram: "", facebook: "" };
  for (const key of ["instagram", "facebook"]) {
    const raw = value[key];
    if (typeof raw !== "string" || raw.length > 500) return null;
    if (!raw.trim()) continue;
    try {
      const url = new URL(raw.trim());
      const host = url.hostname.toLowerCase();
      if (url.protocol !== "https:" || url.username || url.password || ![`${key}.com`, `www.${key}.com`, ...(key === "facebook" ? ["m.facebook.com"] : [])].includes(host) || url.pathname === "/") return null;
      url.hash = ""; result[key] = url.href;
    } catch { return null; }
  }
  return result;
}
export function eventLink(origin, id) { return `${origin}/eventos/${encodeURIComponent(id)}`; }
export function eventShareText(event) {
  return [event.title, event.date ? eventDate(event.date) : "", event.description, event.buttonUrl ? `${event.buttonLabel}: ${event.buttonUrl}` : ""].filter(Boolean).join("\n\n");
}
