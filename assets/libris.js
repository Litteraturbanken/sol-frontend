/**
 * Librisimporten: sökning i Libris xsearch och verk till Directus.
 *
 * Rena funktioner som delas av serverrutterna under server/api/redaktion,
 * sidan pages/redaktion/libris.vue och e2e/libris.spec.js. Logiken följer
 * den tidigare importen (libris-api på lb-appserv-a och
 * Litteraturbanken/librisimport-vite), som skrev direkt i databasen.
 */

export const XSEARCH_URL = "https://libris.kb.se/xsearch";

/** Kopplingstyper: tabell och värdet i dess kolumn ConnectionType. */
export const CONNECTIONS = {
  1: { table: "WorkConnectionTranslator", label: "Verket översatt av [artikeln]" },
  2: { table: "WorkConnectionAboutArticle", label: "Verket handlar om [artikeln]" },
  3: { table: "WorkConnectionAuthor", label: "Verket skrivet av [artikeln]" },
  4: { table: "WorkConnectionReference", label: "Verket referens till artikeln" },
  5: { table: "WorkConnectionAboutWork", label: "[Artikeln] handlar om verket" }
};

/** Fältnamnen som redaktörerna känner igen från Directus. */
export const LABELS = {
  author: "Authors",
  authors_others: "Editors",
  title_main: "TitleSwedish",
  title_subtitle: "SubtitleSwedish",
  title_original: "TitleOriginal",
  title_variant: "Variant",
  title_series: "Serie",
  publishing_house: "PublishingHouseSwedish",
  publishing_place: "PublishingHousePlace",
  lang_orig_source: "LanguageOriginal",
  lang_this: "LanguageTarget",
  publishing_year: "PublishingYearSwedish",
  creator_role: "CreatorRole",
  person_reference: "ReferencePerson",
  general_note: "Anmärkning (sparas ej)",
  libris: "LibrisID"
};

export const WARNINGS = {
  dupe: "Dublett",
  titledupe: "Titeldublett",
  year: "Saknar årtal",
  lang: "Saknar målspråk"
};

// MARC 21: https://www.loc.gov/marc/bibliographic/bdsummary.html
const MARC_FIELDS = {
  "100a": "author",
  "245a": "title_main",
  "245b": "title_subtitle",
  "245c": "creator_role",
  "246a": "title_variant",
  "240a": "title_original",
  "249a": "title_original",
  "041a": "lang_this",
  "041h": "lang_orig_source",
  "440a": "title_series",
  "700a": "authors_others",
  "900a": "person_reference",
  "260a": "publishing_place",
  "260b": "publishing_house",
  "260c": "publishing_year",
  "500a": "general_note"
};
const TRAILING = {
  "260a": /[\s:,]+$/,
  "260b": /[\s:,]+$/,
  "100a": /[\s,]+$/,
  "700a": /[\s,]+$/,
  "245a": /[\s/]+$/,
  "245b": /[\s/]+$/,
  "900a": /,$/
};
const ALWAYS_LIST = new Set(["authors_others", "person_reference"]);

// Sedan övergången till RDA lägger Libris utgivningen i 264 (andra
// indikatorn 1 = utgivning) i stället för 260, med samma delfält. Den
// tidigare importen läste bara 260 och fick varken ort, förlag eller år för
// sådana poster. 264 används när posten saknar 260.
const PUBLICATION_264 = { a: "publishing_place", b: "publishing_house", c: "publishing_year" };
const PUBLICATION_KEYS = Object.values(PUBLICATION_264);

/** Libris-frågan: fritext plus avgränsning till svenska och böcker. */
export function librisQuery(text, { swedishOnly = true, booksOnly = true } = {}) {
  return [String(text || "").trim(), swedishOnly ? "språk:(swe)" : "", booksOnly ? "mat:(böcker)" : ""]
    .filter(Boolean)
    .join(" ");
}

function decodeXml(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (entity, code) => {
    if (code[0] === "#") {
      return String.fromCodePoint(code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : Number(code.slice(1)));
    }
    return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[code.toLowerCase()];
  });
}

/**
 * Posterna i ett xsearch-svar (format=marcxml). total är antalet träffar
 * i Libris, som kan vara fler än de poster som kom med.
 */
export function parseMarcXml(xml) {
  const total = Number(xml.match(/<(?:\w+:)?xsearch\b[^>]*\brecords="(\d+)"/)?.[1] ?? 0);
  const records = [];
  for (const [, body] of xml.matchAll(/<(?:\w+:)?record\b[^>]*>([\s\S]*?)<\/(?:\w+:)?record>/g)) {
    const record = {};
    const id = body.match(/<(?:\w+:)?controlfield\b[^>]*\btag="001"[^>]*>([^<]*)</);
    if (id) record.libris = decodeXml(id[1]).trim();
    const publication = {};
    const fields = body.matchAll(/<(?:\w+:)?datafield\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?datafield>/g);
    for (const [, attributes, inner] of fields) {
      const tag = attributes.match(/\btag="(\d{3})"/)?.[1];
      const ind2 = attributes.match(/\bind2="(.)"/)?.[1];
      for (const [, code, raw] of inner.matchAll(/<(?:\w+:)?subfield\b[^>]*\bcode="([^"])"[^>]*>([\s\S]*?)<\/(?:\w+:)?subfield>/g)) {
        const rda = tag === "264" && ind2 === "1" && PUBLICATION_264[code];
        const key = rda || MARC_FIELDS[tag + code];
        if (!key) continue;
        let value = decodeXml(raw).trim();
        const trailing = TRAILING[(rda ? "260" : tag) + code];
        if (trailing) value = value.replace(trailing, "");
        if (!value) continue;
        ((rda ? publication : record)[key] ||= []).push(value);
      }
    }
    if (!PUBLICATION_KEYS.some(key => key in record)) Object.assign(record, publication);
    for (const [key, values] of Object.entries(record)) {
      if (Array.isArray(values) && values.length === 1 && !ALWAYS_LIST.has(key)) record[key] = values[0];
    }
    records.push(record);
  }
  return { total, records };
}

/**
 * Posterna som sidan visar: listor som text, varningar, sorterade på
 * upphov och titel. existing är Libris-id:n som redan finns som verk.
 */
export function prepareRecords(records, existing = []) {
  const known = new Set(existing.map(String));
  const flat = records.map(record => {
    const out = {};
    for (const [key, value] of Object.entries(record)) {
      out[key] = Array.isArray(value) ? value.join(key === "authors_others" ? ";" : " ") : value;
    }
    const warnings = [];
    if (known.has(String(out.libris))) warnings.push("dupe");
    if (!out.publishing_year || out.publishing_year === "s.a.") warnings.push("year");
    if (!out.lang_this) warnings.push("lang");
    return { ...out, _warnings: warnings, _selected: false, _merged: false };
  });
  const count = key => flat.reduce((m, r) => m.set(r[key], (m.get(r[key]) || 0) + 1), new Map());
  const byLibris = count("libris");
  const byTitle = count("title_main");
  for (const r of flat) {
    if (byLibris.get(r.libris) > 1 && !r._warnings.includes("dupe")) r._warnings.push("dupe");
    if (r.title_main && byTitle.get(r.title_main) > 1) r._warnings.push("titledupe");
  }
  const sortKey = r => `${r.author || ""} ${r.title_main || ""}`;
  return flat.sort((a, b) => sortKey(a).localeCompare(sortKey(b), "sv"));
}

function text(value) {
  if (value === undefined || value === null || value === "") return null;
  return (Array.isArray(value) ? value.join(" ") : String(value)).normalize("NFC");
}

/**
 * Verket som sparas i Directus, med samma fält och standardvärden som den
 * tidigare importen: status "behöver rättas" (Unpublished 2), översättning,
 * och anmärkningen "Librisimporterad" med eventuella varningar.
 * languageId slår upp ett MARC-språk ("swe") till Languages.id.
 */
export function workPayload(record, { languageId, now }) {
  const language = code => (!code || code === "und" ? null : languageId(String(code)) ?? null);
  const year = text(record.publishing_year)?.replace(/[\s;,]+$/, "") || null;
  const publishings = Array.isArray(record.publishings) && record.publishings.length
    ? record.publishings
        .map(p => `${p.publishing_place ?? ""} : ${p.publishing_house ?? ""}, ${p.publishing_year ?? ""}`)
        .join(" ; ")
    : null;
  const editors = Array.isArray(record.authors_others) ? record.authors_others.join(" ; ") : record.authors_others;
  const warnings = Array.isArray(record.warnings) ? record.warnings.filter(w => w in WARNINGS) : [];
  return {
    BibliographyType: 1,
    Authors: text(record.author),
    Editors: text(editors),
    TitleSwedish: text(record.title_main),
    TitleSwedishWithoutDefiniteArticle: text(record.title_main),
    SubtitleSwedish: text(record.title_subtitle),
    TitleSource: "",
    TitleOriginal: text(record.title_original),
    PublishingHouseSwedish: text(record.publishing_house),
    PublishingHousePlace: text(record.publishing_place),
    LanguageOriginal: language(record.lang_orig_source),
    LanguageSource: null,
    LanguageTarget: language(record.lang_this),
    PublishingYearSwedish: year,
    PublishingYearOriginal: "",
    PublishingYearSource: "",
    Publishings: publishings,
    PartOf_Title: "",
    PartOf_Volume: null,
    PartOf_DateNumber: null,
    PartOf_Pages: null,
    Remark: "",
    RemarkHidden: "Librisimporterad" + (warnings.length ? ": " + warnings.join(", ") : ""),
    CreatedDate: now,
    RealYear: year && /^\d{4}$/.test(year) ? year : null,
    CreatorRole: text(record.creator_role),
    ReferencePerson: text(record.person_reference),
    Translation: 1,
    LibrisID: String(record.libris),
    Unpublished: "2",
    AuthorsAlternativeSpelling: null
  };
}
