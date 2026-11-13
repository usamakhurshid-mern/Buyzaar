export const headerDesigns = [
  { id: "balanced", label: "Balanced", note: "Logo left, menu center, search right", logo: "left", menu: "center", search: "right", order: ["logo", "menu", "search"] },
  { id: "classic", label: "Classic", note: "Logo and menu on the left, search on the right", logo: "left", menu: "left", search: "right", order: ["logo", "menu", "search"] },
  { id: "logo-center", label: "Centered logo", note: "Menu left, logo in the middle, search right", logo: "center", menu: "left", search: "right", order: ["menu", "logo", "search"] },
  { id: "menu-right", label: "Menu right", note: "Logo left, menu and search on the right", logo: "left", menu: "right", search: "right", order: ["logo", "menu", "search"] },
  { id: "stacked", label: "Stacked", note: "Logo centered, menu centered below", logo: "center", menu: "center", search: "right", order: ["logo", "menu", "search"] },
];

export const headerDesignMap = Object.fromEntries(headerDesigns.map((item) => [item.id, item]));

export const footerDesigns = [
  { id: "columns", label: "Columns", note: "Brand, link columns, and the newsletter side by side" },
  { id: "centered", label: "Centered", note: "Every block centered" },
  { id: "split", label: "Split", note: "Brand on the left, links on the right" },
  { id: "compact", label: "Compact", note: "One quieter row" },
];

export const adPlaces = [
  ["", "Not placed yet"],
  ["home-hero", "Home · hero"],
  ["home-marquee", "Home · marquee"],
  ["home-categories", "Home · categories"],
  ["home-featured", "Home · featured"],
  ["home-steps", "Home · steps"],
  ["home-close", "Home · closing band"],
  ["home-shop", "Home · products"],
  ["shop-banner", "Shop · banner"],
  ["shop-results", "Shop · results"],
  ["product-banner", "Product · banner"],
  ["product-body", "Product · specs"],
  ["compare-body", "Compare · table"],
  ["tools-banner", "Tools · banner"],
  ["tools-results", "Tools · results"],
  ["tool-banner", "Tool · banner"],
  ["tool-body", "Tool · calculator"],
  ["guides-list", "Guides · list"],
  ["guide-body", "Guide · article"],
  ["about-body", "About · page"],
];
