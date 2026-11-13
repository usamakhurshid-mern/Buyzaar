import { useEffect, useState } from "react";

const KEY = "buyzaar-compare";
export const COMPARE_LIMIT = 3;

export function readCompare() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(list) ? [...new Set(list.map(String))].slice(0, COMPARE_LIMIT) : [];
  } catch {
    return [];
  }
}

export function writeCompare(slugs) {
  const next = [...new Set(slugs.map(String).filter(Boolean))].slice(0, COMPARE_LIMIT);
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("buyzaar-compare"));
  return next;
}

export function toggleCompare(slug) {
  const current = readCompare();
  if (current.includes(slug)) return writeCompare(current.filter((item) => item !== slug));
  if (current.length >= COMPARE_LIMIT) return current;
  return writeCompare([...current, slug]);
}

export function useCompare() {
  const [slugs, setSlugs] = useState(readCompare);
  useEffect(() => {
    const sync = () => setSlugs(readCompare());
    window.addEventListener("buyzaar-compare", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("buyzaar-compare", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return slugs;
}
