import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { brandVars, fill } from "./data/store";

export function useSeo(content, { title, description, path, robots, keywords } = {}) {
  const location = useLocation();
  const route = path || `${location.pathname}${location.search}`;

  useEffect(() => {
    const seo = content?.seo || {};
    const vars = content ? brandVars(content) : {};
    const pageTitle = title || (content ? fill(seo.title, vars) : "") || content?.brand?.name || "Buyzaar";
    const pageDescription = (description != null ? description : fill(seo.description || "", vars)).replace(/\s+/g, " ").trim();
    const pageRobots = robots || seo.robots || "index,follow";
    const pageKeywords = String(keywords != null && keywords !== "" ? keywords : seo.keywords || "").trim();
    const origin = String(seo.siteUrl || window.location.origin).replace(/\/$/, "");
    const pageUrl = `${origin}${route.startsWith("/") ? route : `/${route}`}`;

    document.title = pageTitle;
    setMeta("description", pageDescription);
    setMeta("keywords", pageKeywords);
    setMeta("robots", pageRobots);
    setMeta("og:title", pageTitle, "property");
    setMeta("og:description", pageDescription, "property");
    setMeta("og:type", "website", "property");
    setMeta("og:url", pageUrl, "property");
    setLink("canonical", pageUrl);
  }, [content, title, description, route, robots, keywords]);
}

function setMeta(name, content, attr = "name") {
  const selector = `meta[${attr}="${name}"]`;
  let node = document.head.querySelector(selector);
  if (!content) {
    node?.remove();
    return;
  }
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attr, name);
    document.head.appendChild(node);
  }
  node.setAttribute("content", content);
}

function setLink(rel, href) {
  let node = document.head.querySelector(`link[rel="${rel}"]`);
  if (!href) {
    node?.remove();
    return;
  }
  if (!node) {
    node = document.createElement("link");
    node.rel = rel;
    document.head.appendChild(node);
  }
  node.href = href;
}
