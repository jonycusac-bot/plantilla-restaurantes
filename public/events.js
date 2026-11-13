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
    const translations = {};
    if (e.translations !== undefined) {
      if (!e.translations || typeof e.translations !== 'object' || Array.isArray(e.translations) || Object.keys(e.translations).some(k => !['en','de'].includes(k))) return null;
      for (const [lang,t] of Object.entries(e.translations)) {
        if (!t || typeof t !== 'object' || Array.isArray(t) || Object.keys(t).some(k => !['title','description'].includes(k))) return null;
        translations[lang] = {};
        for (const [key,max] of [['title',120],['description',2000]]) {
          if (t[key] !== undefined) { if (typeof t[key] !== 'string' || t[key].length > max) return null; translations[lang][key] = t[key].trim(); }
        }
      }
    }
    result.push({ id: e.id, title: (e.title).trim(), description: (e.description).trim(), date: e.date, expiresOn: e.expiresOn, imageSrc: e.imageSrc, buttonLabel: (e.buttonLabel).trim(), buttonUrl: e.buttonUrl, active: e.active, ...(e.translations !== undefined ? {translations} : {}) });
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
export const eventLanguage=value=>['es','en','de'].includes(value)?value:'es';
export function localizeEvent(event,language='es') {
  const translated=event.translations?.[eventLanguage(language)];
  return {...event,title:translated?.title?.trim()||event.title,description:translated?.description?.trim()||event.description};
}
export function eventLink(origin, id, language='es') { return `${origin}/eventos/${encodeURIComponent(id)}?lang=${eventLanguage(language)}`; }
export function eventShareText(event,language='es') {
  const localized=localizeEvent(event,language);
  return [localized.title, event.date ? eventDate(event.date,eventLanguage(language)) : '', localized.description].filter(Boolean).join('\n\n');
}

// Only fill absent translation fields of unchanged, known template text. Blank
// fields are intentional owner edits and must remain blank across restarts.
export const demoEvents = [
 {id:'demo-conciertos',title:'Conciertos · Música en directo',description:'Una cena con ritmo propio. Disfruta de nuestra cocina mientras la música en directo pone la banda sonora a una velada para compartir.\n\nConsulta la próxima actuación y reserva tu mesa.\n\nEjemplo de demostración: antes de mostrarlo, añade artista, fecha, horario, condiciones de acceso y contacto para reservas.',translations:{
  en:{title:'Concerts · Live music',description:'Dinner with a rhythm of its own. Enjoy our food while live music sets the mood for an evening together.\n\nAsk about the next performance and book your table.\n\nDemo example: before showing this event, add the artist, date, time, admission conditions and booking contact.'},
  de:{title:'Konzerte · Livemusik',description:'Ein Abendessen mit eigenem Rhythmus. Genießen Sie unsere Küche, während Livemusik für die passende Atmosphäre sorgt.\n\nErkundigen Sie sich nach dem nächsten Auftritt und reservieren Sie Ihren Tisch.\n\nDemobeispiel: Ergänzen Sie vor der Veröffentlichung Künstler, Datum, Uhrzeit, Einlassbedingungen und Kontakt für Reservierungen.'}}},
 {id:'demo-cumpleanos',title:'Cumpleaños · Celebra tu día con nosotros',description:'Reúne a tus personas favoritas y celebra un cumpleaños alrededor de una buena mesa. Cuéntanos cuántos seréis y cómo te gustaría celebrarlo para consultar las opciones del restaurante.\n\nPregunta por disponibilidad, propuestas para grupos y necesidades alimentarias.\n\nEjemplo de demostración: antes de mostrarlo, confirma capacidad, menús, precios, condiciones para la tarta y contacto para reservas.',translations:{
  en:{title:'Birthdays · Celebrate your day with us',description:'Bring your favourite people together and celebrate a birthday over a good meal. Tell us how many guests you expect and how you would like to celebrate so we can discuss the restaurant’s options.\n\nAsk about availability, group dining and dietary requirements.\n\nDemo example: before showing this event, confirm capacity, menus, prices, cake arrangements and booking contact.'},
  de:{title:'Geburtstage · Feiern Sie Ihren Tag mit uns',description:'Versammeln Sie Ihre Lieblingsmenschen und feiern Sie einen Geburtstag bei einem guten Essen. Teilen Sie uns mit, wie viele Gäste kommen und wie Sie feiern möchten, damit wir die Möglichkeiten des Restaurants besprechen können.\n\nFragen Sie nach Verfügbarkeit, Angeboten für Gruppen und besonderen Ernährungsbedürfnissen.\n\nDemobeispiel: Bestätigen Sie vor der Veröffentlichung Kapazität, Menüs, Preise, Regelungen für die Geburtstagstorte und Kontakt für Reservierungen.'}}}
];
export function prepareDemoEventTranslations(events) {
 let result=events;
 for(let i=0;i<events.length;i++) {
  const event=events[i],demo=demoEvents.find(d=>d.id===event.id);if(!demo)continue;
  let edited;
  for(const lang of ['en','de'])for(const field of ['title','description']) {
   if(event[field]===demo[field]&&!Object.hasOwn(event.translations?.[lang]||{},field)) {
    edited??=structuredClone(event);edited.translations??={};edited.translations[lang]??={};edited.translations[lang][field]=demo.translations[lang][field];
   }
  }
  if(edited){if(result===events)result=events.slice();result[i]=edited;}
 }
 return result;
}
