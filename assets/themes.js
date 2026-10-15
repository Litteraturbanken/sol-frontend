/**
 * Sajtens färgteman. Redaktörerna väljer ett tema i Directus-singletonen
 * Meta; färgerna bestäms här, så att varje val håller läsbarheten.
 * e2e/themes.spec.js räknar kontrasten för varje tema enligt WCAG 2.1.
 *
 * "standard" är sajten som den såg ut innan teman fanns och behåller sina
 * gamla färger. De tre pastellteman klarar AA (4,5:1) för länkar och dämpad
 * text och AAA (7:1) för brödtexten.
 */

export const TEXT_COLOR = "#333333";

export const THEMES = {
  standard: { label: "Vit", bg: "#ffffff", link: "#618296", muted: "#808080" },
  dimbla: { label: "Dimblå", bg: "#e4edf2", link: "#335a6e", muted: "#515e66" },
  salvia: { label: "Salvia", bg: "#e5eee3", link: "#365e40", muted: "#525c54" },
  sand: { label: "Sand", bg: "#eee7d3", link: "#5f5440", muted: "#555c57" }
};

export const DEFAULT_THEME = "standard";

/** Teman som bytt namn: gammalt namn -> nytt. directus-meta.mjs flyttar sparade värden. */
export const RENAMED_THEMES = { rose: "sand" };

export function validTheme(value) {
  return Object.hasOwn(THEMES, value) ? value : null;
}

function rgb(hex) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map(i => parseInt(value.slice(i, i + 2), 16));
}

function luminance(hex) {
  const [r, g, b] = rgb(hex).map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * CSS-variablerna för ett tema. Standardtemat behåller startsidans gamla
 * molnbild; pastellteman har sin bakgrundsfärg även där.
 */
export function themeVariables(name) {
  const theme = THEMES[validTheme(name) || DEFAULT_THEME];
  const vars = {
    "--sol-bg": theme.bg,
    "--sol-text": TEXT_COLOR,
    "--sol-link": theme.link,
    "--sol-muted": theme.muted
  };
  if (theme !== THEMES[DEFAULT_THEME]) vars["--sol-start-bg"] = theme.bg;
  return vars;
}
