import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { isDark, themeForMode } from "../data/color";
import { applyFonts } from "../data/fonts";
import { ADMIN_KEY, normalize } from "../data/store";
import SiteSkeleton from "../components/SiteSkeleton";
import { CatalogContext, useCatalog } from "./context";

async function loadPublished() {
  try {
    const live = await fetch("/api/content", { cache: "no-store" });
    if (live.ok) {
      const data = await live.json();
      if (data && Array.isArray(data.tools) && Array.isArray(data.categories)) return data;
    }
  } catch {
    // Fall through to the static file.
  }
  const response = await fetch("/content.json", { cache: "no-store" });
  if (!response.ok) return null;
  return response.json();
}

const themeVars = {
  bg: "--bg",
  ink: "--ink",
  muted: "--muted",
  gold: "--gold",
  ember: "--ember",
  stage: "--stage",
  promoBg: "--promo-bg",
  promoText: "--promo-text",
  footerBg: "--footer-bg",
  footerText: "--footer-text",
  paper: "--paper",
};

function pxClamp(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

export function ApplyChrome() {
  const { content, mode } = useCatalog();
  const location = useLocation();

  useLayoutEffect(() => {
    const root = document.documentElement;
    const admin = location.pathname.startsWith("/admin");
    if (admin) {
      root.dataset.admin = "1";
      return;
    }
    delete root.dataset.admin;
    if (content) applyFonts(root, content.fonts);
  }, [content, location.pathname]);

  useEffect(() => {
    const root = document.documentElement;
    const admin = location.pathname.startsWith("/admin");
    if (admin || !content) return undefined;
    const stageMode = content.theme.stageMode === "light" ? "light" : "dark";
    const wantDark = mode === "dark";
    const palette = themeForMode(content.theme, wantDark ? "dark" : "light");
    Object.entries(themeVars).forEach(([key, cssVar]) => {
      if (palette[key]) root.style.setProperty(cssVar, palette[key]);
    });
    const darkSurface = wantDark || isDark(palette.bg);
    root.style.setProperty("--line", darkSurface ? "rgba(246, 239, 230, 0.16)" : "rgba(27, 22, 18, 0.12)");
    root.style.colorScheme = darkSurface ? "dark" : "light";
    root.dataset.mode = wantDark ? "dark" : "light";
    root.dataset.surface = darkSurface ? "dark" : "light";
    root.dataset.stage = !wantDark && stageMode === "light" ? "light" : "dark";
    const layout = content.layout || {};
    const columns = { narrow: "760px", standard: "1180px", wide: "1360px", full: "100%" };
    root.style.setProperty("--wrap", columns[layout.contentWidth] || "1180px");
    root.style.setProperty("--section-gap", `${pxClamp(layout.sectionGap, 36, 0, 200)}px`);
    root.dataset.header = layout.headerWidth || "full";
    root.dataset.promo = layout.promoAlign || "center";
    root.dataset.promoWidth = layout.promoWidth || "full";
    root.dataset.banner = layout.bannerWidth || "contained";
    root.dataset.bannerAlign = layout.bannerAlign || "left";
    root.dataset.bodyAlign = layout.bodyAlign || "left";
    root.dataset.footer = layout.footerWidth || "full";
    root.dataset.footerAlign = layout.footerAlign || "left";
    const icon = document.querySelector("link[rel='icon']");
    if (icon) {
      const href = content.brand.logo || "/favicon.svg";
      icon.href = href;
      icon.type = href.endsWith(".svg") ? "image/svg+xml" : href.endsWith(".png") ? "image/png" : href.endsWith(".webp") ? "image/webp" : "";
    }
    return undefined;
  }, [content, mode, location.pathname]);

  return null;
}

export function CatalogProvider({ children }) {
  const [preview, setPreview] = useState(() => new URLSearchParams(window.location.search).get("preview") === "1");
  const [content, setContent] = useState(null);
  const [mode, setModeState] = useState(() => (localStorage.getItem("buyzaar-mode") === "dark" ? "dark" : "light"));

  const setPreviewContent = useCallback((data) => {
    setPreview(true);
    document.documentElement.dataset.preview = "1";
    setContent(normalize(data));
  }, []);

  useEffect(() => {
    if (preview) return undefined;
    let cancel = false;
    loadPublished()
      .then((data) => {
        if (!cancel) setContent(normalize(data));
      })
      .catch(() => {
        if (!cancel) setContent(normalize(null));
      });
    return () => {
      cancel = true;
    };
  }, [preview]);

  function setMode(next) {
    const value = next === "dark" ? "dark" : "light";
    if (!preview) localStorage.setItem("buyzaar-mode", value);
    setModeState(value);
  }

  async function save(next) {
    const key = sessionStorage.getItem(ADMIN_KEY) || "";
    const response = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify(next),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const error = new Error(payload.error || "The live admin API failed.");
      error.status = response.status;
      throw error;
    }
    setContent(normalize(next));
  }

  if (!content && !preview) return <SiteSkeleton />;

  return (
    <CatalogContext.Provider value={{ content, save, mode, setMode, setPreviewContent }}>
      {children}
    </CatalogContext.Provider>
  );
}

export { useCatalog };
