export function emptyAd() {
  return {
    id: `ad-${Math.random().toString(36).slice(2, 8)}`,
    name: "New ad",
    script: "",
    show: false,
    pages: ["home"],
    place: "",
    edge: "after",
    w: 100,
    h: 220,
  };
}

export const pageOptions = [
  ["home", "Home"],
  ["shop", "Shop"],
  ["product", "Product pages"],
  ["compare", "Compare"],
  ["search", "Search"],
  ["tools", "Tools directory"],
  ["tool", "Tool pages"],
  ["guides", "Guides directory"],
  ["guide", "Guide pages"],
  ["about", "About"],
];

function clamp(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number * 10) / 10));
}

export function normalizeAds(list) {
  if (!Array.isArray(list)) return [];
  return list.map((ad) => {
    const base = emptyAd();
    return {
      ...base,
      ...ad,
      id: ad?.id || base.id,
      name: String(ad?.name || "Ad").trim() || "Ad",
      script: String(ad?.script || ""),
      show: ad?.show === true,
      pages: Array.isArray(ad?.pages) ? ad.pages.map(String).filter(Boolean) : ["home"],
      place: String(ad?.place || ""),
      edge: ad?.edge === "before" ? "before" : "after",
      w: clamp(ad?.w, 20, 100, 100),
      h: clamp(ad?.h, 80, 1400, 220),
    };
  });
}

export function pageKey(pathname) {
  if (pathname === "/") return "home";
  if (pathname === "/shop") return "shop";
  if (pathname.startsWith("/shop/")) return "product";
  if (pathname === "/compare") return "compare";
  if (pathname === "/search") return "search";
  if (pathname === "/tools") return "tools";
  if (pathname.startsWith("/tools/")) return "tool";
  if (pathname === "/guides") return "guides";
  if (pathname.startsWith("/guides/")) return "guide";
  if (pathname === "/about") return "about";
  return "";
}

export function adOnPage(ad, page) {
  if (!ad || ad.show === false || !page) return false;
  const pages = ad.pages || [];
  return pages.includes("*") || pages.includes(page);
}
