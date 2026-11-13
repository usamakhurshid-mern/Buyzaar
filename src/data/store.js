import { normalizeAds } from "./ads";
import { defaultContent } from "./defaultContent";
import { normalizeFonts } from "./fonts";
import { themeIds } from "./themes";

export const RESERVED = ["tools", "guides", "about", "admin", "guide", "tool", "shop", "compare", "search"];
export const ADMIN_KEY = "buyzaar-admin-key";

export function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function mergeContent(base, override) {
  if (Array.isArray(base)) return Array.isArray(override) ? override : base;
  if (override && typeof override === "object" && base && typeof base === "object" && !Array.isArray(override)) {
    const next = { ...base };
    Object.keys(override).forEach((key) => {
      next[key] = key in base ? mergeContent(base[key], override[key]) : override[key];
    });
    return next;
  }
  return override === undefined ? base : override;
}

const toolKinds = new Set(["zakat", "electricity", "fuel", "age", "percentage", "gpa", "discount"]);

export function normalize(raw) {
  const merged = mergeContent(defaultContent, raw && typeof raw === "object" ? raw : {});
  const tools = Array.isArray(raw?.tools) ? raw.tools : defaultContent.tools;
  merged.tools = tools.map((tool) => ({
    visible: true,
    featured: false,
    blurb: "",
    description: "",
    seoTitle: "",
    seoDescription: "",
    tone: "#e7dcd0",
    settings: {},
    ...tool,
    kind: toolKinds.has(tool?.kind) ? tool.kind : "percentage",
  }));
  const categories = Array.isArray(raw?.categories) ? raw.categories : defaultContent.categories;
  merged.categories = categories.map((category) => ({ blurb: "", ...category }));
  const guides = Array.isArray(raw?.guides) ? raw.guides : defaultContent.guides;
  merged.guides = guides.map((guide) => ({
    visible: true,
    excerpt: "",
    ...guide,
    sections: (guide?.sections || []).map((section) => ({
      heading: section?.heading || "",
      body: section?.body || "",
    })),
  }));
  const productCategories = Array.isArray(raw?.productCategories) ? raw.productCategories : defaultContent.productCategories;
  merged.productCategories = productCategories.map((category) => ({ blurb: "", ...category }));
  const products = Array.isArray(raw?.products) ? raw.products : defaultContent.products;
  merged.products = products.map((product) => ({
    visible: true,
    featured: false,
    blurb: "",
    description: "",
    price: 0,
    tone: "#d5e4f7",
    buyLabel: "Open the shop",
    buyUrl: "",
    seoTitle: "",
    seoDescription: "",
    ...product,
    specs: (product?.specs || []).map((spec) => ({ label: spec?.label || "", value: spec?.value || "" })),
  }));
  merged.ads = normalizeAds(Array.isArray(raw?.ads) ? raw.ads : merged.ads);
  merged.fonts = normalizeFonts(merged.fonts);
  return merged;
}

export function visibleTools(content) {
  return (content?.tools || []).filter((tool) => tool.visible !== false && tool.slug);
}

export function visibleGuides(content) {
  return (content?.guides || []).filter((guide) => guide.visible !== false && guide.slug);
}

export function visibleProducts(content) {
  return (content?.products || []).filter((product) => product.visible !== false && product.slug);
}

export function productCategoryById(content, id) {
  return (content?.productCategories || []).find((category) => category.id === id) || null;
}

export function countInProductCategory(content, id) {
  return visibleProducts(content).filter((product) => product.category === id).length;
}

export function featuredProducts(content) {
  const products = visibleProducts(content);
  const picked = products.filter((product) => product.featured);
  return picked.length ? picked : products.slice(0, 4);
}

export function categoryById(content, id) {
  return content.categories.find((category) => category.id === id) || null;
}

export function countInCategory(content, id) {
  return visibleTools(content).filter((tool) => tool.category === id).length;
}

export function fill(template, vars) {
  return String(template ?? "").replace(/\{(\w+)\}/g, (_, key) => (vars[key] == null ? "" : String(vars[key])));
}

export function brandVars(content, extra = {}) {
  return {
    name: content.brand.name,
    tagline: content.brand.tagline,
    handle: content.brand.handle,
    email: content.brand.email,
    currency: content.brand.currency,
    tools: visibleTools(content).length,
    guides: visibleGuides(content).length,
    categories: content.categories.length,
    products: visibleProducts(content).length,
    productCategories: (content.productCategories || []).length,
    ...extra,
  };
}

export function navItemActive(item, location) {
  if (!item) return false;
  const self = matchTo(item.to, location) || nestedMatch(item.to, location);
  if (item.type === "dropdown") return self || (item.children || []).some((child) => matchTo(child.to, location));
  return self;
}

function nestedMatch(to, location) {
  if (!to || /^https?:/i.test(to)) return false;
  const url = new URL(to, "http://buyzaar.local");
  if (url.pathname === "/" || url.search) return false;
  return location.pathname.startsWith(`${url.pathname}/`);
}

function matchTo(to, location) {
  if (!to || /^https?:/i.test(to)) return false;
  const url = new URL(to, "http://buyzaar.local");
  if (url.pathname === "/") return location.pathname === "/";
  if (location.pathname !== url.pathname) return false;
  if (!url.search) return !location.search;
  const have = new URLSearchParams(location.search);
  for (const [key, value] of url.searchParams) {
    if (have.get(key) !== value) return false;
  }
  return true;
}

function oneOf(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function px(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

export function prepareContent(draft) {
  const content = structuredClone(draft);
  content.tools = (content.tools || []).map((tool) => ({
    ...tool,
    name: String(tool.name || "").trim(),
    slug: slugify(tool.slug || tool.name),
    kind: toolKinds.has(tool.kind) ? tool.kind : "percentage",
    blurb: String(tool.blurb || "").trim(),
    description: String(tool.description || "").trim(),
    seoTitle: String(tool.seoTitle || "").trim(),
    seoDescription: String(tool.seoDescription || "").replace(/\s+/g, " ").trim(),
    visible: tool.visible !== false,
    featured: Boolean(tool.featured),
  }));
  content.categories = (content.categories || []).map((category) => ({
    ...category,
    name: String(category.name || "").trim(),
    id: slugify(category.id || category.name),
    blurb: String(category.blurb || "").trim(),
  }));
  content.productCategories = (content.productCategories || []).map((category) => ({
    ...category,
    name: String(category.name || "").trim(),
    id: slugify(category.id || category.name),
    blurb: String(category.blurb || "").trim(),
  }));
  content.products = (content.products || []).map((product) => ({
    ...product,
    name: String(product.name || "").trim(),
    slug: slugify(product.slug || product.name),
    blurb: String(product.blurb || "").trim(),
    description: String(product.description || "").trim(),
    price: Number(product.price) || 0,
    buyLabel: String(product.buyLabel || "").trim(),
    buyUrl: String(product.buyUrl || "").trim(),
    seoTitle: String(product.seoTitle || "").trim(),
    seoDescription: String(product.seoDescription || "").replace(/\s+/g, " ").trim(),
    visible: product.visible !== false,
    featured: Boolean(product.featured),
    specs: (product.specs || [])
      .map((spec) => ({ label: String(spec.label || "").trim(), value: String(spec.value || "").trim() }))
      .filter((spec) => spec.label || spec.value),
  }));
  content.guides = (content.guides || []).map((guide) => ({
    ...guide,
    title: String(guide.title || "").trim(),
    slug: slugify(guide.slug || guide.title),
    excerpt: String(guide.excerpt || "").trim(),
    visible: guide.visible !== false,
    sections: (guide.sections || [])
      .map((section) => ({ heading: String(section.heading || "").trim(), body: String(section.body || "").trim() }))
      .filter((section) => section.heading || section.body),
  }));
  content.ads = normalizeAds(content.ads);
  content.seo = {
    title: String(content.seo?.title || "").trim(),
    description: String(content.seo?.description || "").replace(/\s+/g, " ").trim(),
    keywords: String(content.seo?.keywords || "").trim(),
    siteUrl: String(content.seo?.siteUrl || "").trim().replace(/\/$/, ""),
    robots: content.seo?.robots === "noindex,nofollow" ? "noindex,nofollow" : "index,follow",
  };
  content.layout = {
    contentWidth: oneOf(content.layout?.contentWidth, ["narrow", "standard", "wide", "full"], "standard"),
    bodyAlign: oneOf(content.layout?.bodyAlign, ["left", "center", "right"], "left"),
    headerWidth: oneOf(content.layout?.headerWidth, ["full", "contained"], "full"),
    promoWidth: oneOf(content.layout?.promoWidth, ["full", "contained"], "full"),
    promoAlign: oneOf(content.layout?.promoAlign, ["left", "center", "right"], "center"),
    bannerWidth: oneOf(content.layout?.bannerWidth, ["contained", "full"], "contained"),
    bannerAlign: oneOf(content.layout?.bannerAlign, ["left", "center", "right"], "left"),
    heroHeight: px(content.layout?.heroHeight, 0, 0, 1200),
    sectionGap: px(content.layout?.sectionGap, 36, 0, 200),
    footerWidth: oneOf(content.layout?.footerWidth, ["full", "contained"], "full"),
    footerAlign: oneOf(content.layout?.footerAlign, ["left", "center", "right"], "left"),
  };
  content.header.design = oneOf(content.header?.design, ["balanced", "classic", "logo-center", "menu-right", "stacked"], "balanced");
  content.header.bar = oneOf(content.header?.bar, ["glass", "solid", "ink", "line"], "glass");
  content.header.links = oneOf(content.header?.links, ["underline", "pills", "plain"], "underline");
  content.footer.design = oneOf(content.footer?.design, ["columns", "centered", "split", "compact"], "columns");
  content.footer.align = oneOf(content.footer?.align, ["layout", "left", "center", "right"], "layout");
  content.footer.tone = oneOf(content.footer?.tone, ["ink", "paper", "contrast"], "ink");
  content.footer.logo = String(content.footer?.logo || "").trim();
  content.fonts = normalizeFonts(content.fonts);
  content.theme.preset = themeIds.includes(content.theme?.preset) || content.theme?.preset === "custom" ? content.theme.preset : "harbor";
  content.theme.surface = oneOf(content.theme?.surface, ["light", "dark"], "light");
  content.theme.stageMode = oneOf(content.theme?.stageMode, ["light", "dark"], "light");
  content.header.items = (content.header.items || []).map((item) => ({
    ...item,
    id: item.id || uid("nav"),
    show: item.show !== false,
    children: (item.children || []).map((child) => ({ ...child, id: child.id || uid("nav"), show: child.show !== false })),
  }));
  content.home.marquee.phrases = (content.home?.marquee?.phrases || []).map((phrase) => String(phrase).trim()).filter(Boolean);
  return content;
}

export function validateContent(content) {
  const errors = [];
  const slugs = new Set();
  content.tools.forEach((tool, index) => {
    if (!tool.name) errors.push(`Tool ${index + 1} needs a name.`);
    if (!tool.slug) errors.push(`${tool.name || `Tool ${index + 1}`} needs a slug.`);
    if (RESERVED.includes(tool.slug)) errors.push(`“${tool.slug}” is reserved. Pick another tool slug.`);
    if (tool.slug && slugs.has(tool.slug)) errors.push(`Tool slug “${tool.slug}” is used twice.`);
    if (tool.slug) slugs.add(tool.slug);
    if (tool.category && !content.categories.some((category) => category.id === tool.category)) {
      errors.push(`${tool.name} points at a category that does not exist.`);
    }
  });
  const ids = new Set();
  content.categories.forEach((category, index) => {
    if (!category.name) errors.push(`Category ${index + 1} needs a name.`);
    if (!category.id) errors.push(`Category ${index + 1} needs an id.`);
    if (category.id && ids.has(category.id)) errors.push(`Category id “${category.id}” is used twice.`);
    if (category.id) ids.add(category.id);
  });
  const productIds = new Set();
  (content.productCategories || []).forEach((category, index) => {
    if (!category.name) errors.push(`Product category ${index + 1} needs a name.`);
    if (!category.id) errors.push(`Product category ${index + 1} needs an id.`);
    if (category.id && productIds.has(category.id)) errors.push(`Product category “${category.id}” is used twice.`);
    if (category.id) productIds.add(category.id);
  });
  const productSlugs = new Set();
  (content.products || []).forEach((product, index) => {
    if (!product.name) errors.push(`Product ${index + 1} needs a name.`);
    if (!product.slug) errors.push(`${product.name || `Product ${index + 1}`} needs a slug.`);
    if (RESERVED.includes(product.slug)) errors.push(`“${product.slug}” is reserved. Pick another product slug.`);
    if (product.slug && productSlugs.has(product.slug)) errors.push(`Product slug “${product.slug}” is used twice.`);
    if (product.slug) productSlugs.add(product.slug);
    if (product.category && !content.productCategories.some((category) => category.id === product.category)) {
      errors.push(`${product.name} points at a product category that does not exist.`);
    }
  });
  const guideSlugs = new Set();
  content.guides.forEach((guide, index) => {
    if (!guide.title) errors.push(`Guide ${index + 1} needs a title.`);
    if (!guide.slug) errors.push(`${guide.title || `Guide ${index + 1}`} needs a slug.`);
    if (RESERVED.includes(guide.slug)) errors.push(`“${guide.slug}” is reserved. Pick another guide slug.`);
    if (guide.slug && guideSlugs.has(guide.slug)) errors.push(`Guide slug “${guide.slug}” is used twice.`);
    if (guide.slug) guideSlugs.add(guide.slug);
  });
  return errors;
}

export function syncShopMenu(content) {
  const next = structuredClone(content);
  const menu = next.header.items.find((item) => item.id === "shop");
  if (!menu) return next;
  menu.type = "dropdown";
  menu.to = "/shop";
  menu.children = [
    { id: "all-shop", label: "All products", to: "/shop", show: true },
    ...(next.productCategories || []).map((category) => ({
      id: `pcat-${category.id}`,
      label: category.name,
      to: `/shop?category=${category.id}`,
      show: true,
    })),
    { id: "compare-link", label: "Compare", to: "/compare", show: true },
  ];
  return next;
}

export function syncToolMenu(content) {
  const next = structuredClone(content);
  const menu = next.header.items.find((item) => item.id === "tools");
  if (!menu) return next;
  menu.type = "dropdown";
  menu.to = "/tools";
  menu.children = [
    { id: "all-tools", label: next.directory?.allLabel || "All tools", to: "/tools", show: true },
    ...next.categories.map((category) => ({
      id: `cat-${category.id}`,
      label: category.name,
      to: `/tools?category=${category.id}`,
      show: true,
    })),
  ];
  return next;
}

export function moveItem(list, index, direction) {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const next = list.slice();
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

export function applyTheme(content, theme) {
  content.theme = {
    ...content.theme,
    ...theme.colors,
    preset: theme.id,
    surface: theme.surface,
    stageMode: theme.stageMode,
  };
  content.header.design = theme.header.design;
  content.header.bar = theme.header.bar;
  content.header.links = theme.header.links;
  content.footer.design = theme.footer.design;
  content.footer.align = theme.footer.align;
  content.footer.tone = theme.footer.tone;
  content.layout = { ...content.layout, ...theme.layout };
}

export function featuredTools(content) {
  const tools = visibleTools(content);
  const picked = tools.filter((tool) => tool.featured);
  return picked.length ? picked : tools.slice(0, 4);
}
