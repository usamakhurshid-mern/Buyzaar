export const fontFamilies = [
  { id: "figtree", label: "Figtree", stack: '"Figtree", system-ui, sans-serif', google: "Figtree:wght@400;500;600;700" },
  { id: "space", label: "Space Grotesk", stack: '"Space Grotesk", system-ui, sans-serif', google: "Space+Grotesk:wght@500;600;700" },
  { id: "inter", label: "Inter", stack: '"Inter", system-ui, sans-serif', google: "Inter:wght@400;500;600;700" },
  { id: "source-serif", label: "Source Serif", stack: '"Source Serif 4", Georgia, serif', google: "Source+Serif+4:wght@500;600;700" },
  { id: "system", label: "System", stack: "system-ui, sans-serif", google: "" },
];

export const fontRoles = [
  { id: "banner", label: "Banner titles", hint: "The home hero and the title on inner pages.", size: 64, min: 28, max: 96, family: "space" },
  { id: "heading", label: "Headings", hint: "Section titles.", size: 36, min: 20, max: 72, family: "space" },
  { id: "card", label: "Tool names", hint: "The name on each tool card.", size: 22, min: 14, max: 40, family: "space" },
  { id: "paragraph", label: "Paragraphs", hint: "Body text and guide copy.", size: 16, min: 12, max: 22, family: "figtree" },
  { id: "button", label: "Buttons", hint: "Buttons and the menu.", size: 15, min: 12, max: 22, family: "figtree" },
  { id: "result", label: "Results", hint: "The large number a calculator prints.", size: 44, min: 20, max: 72, family: "space" },
  { id: "eyebrow", label: "Small labels", hint: "The short uppercase line above a title.", size: 12, min: 10, max: 16, family: "figtree" },
];

export function familyById(id) {
  return fontFamilies.find((item) => item.id === id) || fontFamilies[0];
}

export function normalizeFonts(raw) {
  const next = {};
  for (const role of fontRoles) {
    const saved = raw?.[role.id] || {};
    const size = Number(saved.size);
    next[role.id] = {
      family: fontFamilies.some((item) => item.id === saved.family) ? saved.family : role.family,
      size: Number.isFinite(size) ? Math.min(role.max, Math.max(role.min, Math.round(size))) : role.size,
    };
  }
  return next;
}

export function fontStylesheet(fonts) {
  const clean = normalizeFonts(fonts);
  const params = [...new Set(Object.values(clean).map((item) => familyById(item.family).google).filter(Boolean))];
  if (!params.length) return "";
  return `https://fonts.googleapis.com/css2?${params.map((item) => `family=${item}`).join("&")}&display=swap`;
}

export function applyFonts(root, fonts) {
  const clean = normalizeFonts(fonts);
  for (const role of fontRoles) {
    const item = clean[role.id];
    root.style.setProperty(`--ff-${role.id}`, familyById(item.family).stack);
    root.style.setProperty(`--fs-${role.id}`, `${item.size}px`);
  }
  const href = fontStylesheet(clean);
  let link = document.getElementById("buyzaar-fonts");
  if (!href) {
    link?.remove();
    return;
  }
  if (!link) {
    link = document.createElement("link");
    link.id = "buyzaar-fonts";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (link.getAttribute("href") !== href) link.setAttribute("href", href);
}
