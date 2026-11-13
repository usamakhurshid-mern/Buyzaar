import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCatalog } from "../catalog/context";
import { Region } from "../components/Region";
import ProductCard from "../components/ProductCard";
import { fill, productCategoryById, visibleProducts } from "../data/store";
import { useSeo } from "../useSeo";

export default function Shop() {
  const { content } = useCatalog();
  const shop = content.shop;
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const sort = params.get("sort") || "featured";
  const current = productCategoryById(content, category);

  useSeo(content, {
    title: current ? `${current.name} — ${content.brand.name}` : `${shop.title} — ${content.brand.name}`,
    description: current?.blurb || shop.intro,
    path: `/shop${params.toString() ? `?${params}` : ""}`,
  });

  const products = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = visibleProducts(content).filter((product) => {
      if (category && product.category !== category) return false;
      if (!query) return true;
      const specs = (product.specs || []).map((spec) => `${spec.label} ${spec.value}`).join(" ");
      return `${product.name} ${product.blurb} ${product.description} ${specs}`.toLowerCase().includes(query);
    });
    if (sort === "price") list = [...list].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    else if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else list = [...list].sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name));
    return list;
  }, [content, q, category, sort]);

  function update(next) {
    const merged = { q, category, sort, ...next };
    const clean = {};
    if (merged.q) clean.q = merged.q;
    if (merged.category) clean.category = merged.category;
    if (merged.sort && merged.sort !== "featured") clean.sort = merged.sort;
    setParams(clean);
  }

  return (
    <div className="page">
      <Region id="shop-banner">
        <header className="page-banner">
          <p className="eyebrow">{shop.kicker}</p>
          <h1>{current ? current.name : q ? `Results for “${q}”` : fill(shop.title, { name: content.brand.name })}</h1>
          <p className="lede">{current?.blurb || shop.intro}</p>
        </header>
      </Region>
      <Region id="shop-results">
        <div className="section wrap directory">
          <aside className={`filters ${open ? "open" : ""}`}>
            <button type="button" className="filter-toggle" onClick={() => setOpen((value) => !value)}>
              {open ? shop.hideLabel : shop.showLabel}
            </button>
            <div className="filter-body">
              <label>
                <span>Search</span>
                <input value={q} placeholder={shop.searchPlaceholder} onChange={(event) => update({ q: event.target.value })} />
              </label>
              <label>
                <span>Category</span>
                <select value={category} onChange={(event) => update({ category: event.target.value })}>
                  <option value="">{shop.allLabel}</option>
                  {(content.productCategories || []).map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Sort</span>
                <select value={sort} onChange={(event) => update({ sort: event.target.value })}>
                  <option value="featured">{shop.sortFeatured}</option>
                  <option value="price">{shop.sortPrice}</option>
                  <option value="name">{shop.sortName}</option>
                </select>
              </label>
            </div>
          </aside>
          <div>
            <p className="fine">{products.length} {products.length === 1 ? "product" : "products"}</p>
            {products.length === 0 ? (
              <div className="empty">
                <h2>{shop.emptyTitle}</h2>
                <p>{shop.emptyText}</p>
                <button type="button" className="btn btn-ember" onClick={() => setParams({})}>{shop.emptyButton}</button>
              </div>
            ) : (
              <div className="card-grid">
                {products.map((product) => (
                  <ProductCard
                    key={product.slug}
                    product={product}
                    category={productCategoryById(content, product.category)?.name}
                    currency={content.brand.currency}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Region>
    </div>
  );
}
