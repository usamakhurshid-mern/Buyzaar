function rgb(hex) {
  const raw = String(hex || "").trim().replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((part) => part + part).join("") : raw;
  const value = Number.parseInt(full.slice(0, 6), 16);
  if (!Number.isFinite(value) || full.length < 6) return null;
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function hex({ r, g, b }) {
  const channel = (value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

export function mix(from, to, amount) {
  const start = rgb(from);
  const end = rgb(to);
  if (!start || !end) return from;
  const t = Math.max(0, Math.min(1, amount));
  return hex({
    r: start.r + (end.r - start.r) * t,
    g: start.g + (end.g - start.g) * t,
    b: start.b + (end.b - start.b) * t,
  });
}

export function isDark(color) {
  const value = rgb(color);
  if (!value) return false;
  const channel = (part) => {
    const ratio = part / 255;
    return ratio <= 0.03928 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4;
  };
  const luma = 0.2126 * channel(value.r) + 0.7152 * channel(value.g) + 0.0722 * channel(value.b);
  return luma < 0.42;
}

export function themeForMode(colors, mode) {
  const wantDark = mode === "dark";
  if (isDark(colors.bg) === wantDark) return colors;
  return wantDark ? toDark(colors) : toLight(colors);
}

function toDark(colors) {
  const bg = isDark(colors.stage) ? mix(colors.stage, "#000000", 0.4) : mix(colors.ink, "#000000", 0.8);
  const paper = mix(bg, "#ffffff", 0.1);
  const ink = mix(isDark(colors.paper) ? "#f6f1ea" : colors.paper, "#ffffff", 0.08);
  const muted = mix(ink, bg, 0.38);
  const stage = mix(bg, "#000000", 0.28);
  const promoBg = isDark(colors.promoBg) ? colors.promoBg : mix(colors.ember, "#000000", 0.55);
  const promoText = isDark(promoBg) ? ink : mix(colors.ink, "#000000", 0.7);
  return { ...colors, bg, ink, muted, paper, stage, promoBg, promoText, footerBg: mix(bg, "#000000", 0.35), footerText: ink };
}

function toLight(colors) {
  const bg = mix(colors.bg, "#f7f4ef", 0.88);
  const paper = "#fffaf6";
  const ink = isDark(colors.stage) ? colors.stage : isDark(colors.ink) ? colors.ink : "#1b1612";
  const muted = mix(ink, bg, 0.42);
  const stage = isDark(colors.stage) ? colors.stage : mix(ink, "#000000", 0.72);
  const promoBg = isDark(colors.promoBg) ? colors.promoBg : mix(paper, colors.gold || ink, 0.18);
  const promoText = isDark(promoBg) ? paper : ink;
  return { ...colors, bg, ink, muted, paper, stage, promoBg, promoText, footerBg: stage, footerText: paper };
}
