import { createContext, useContext } from "react";

export const CatalogContext = createContext(null);

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("useCatalog must be used inside CatalogProvider");
  return value;
}
