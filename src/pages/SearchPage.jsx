import { Link, useSearchParams } from "react-router-dom";
import { useCatalog } from "../catalog/context";
import ProductCard from "../components/ProductCard";
import { productCategoryById, visibleGuides, visibleProducts, visibleTools, categoryById } from "../data/store";
import { useSeo } from "../useSeo";
import { ToolCard } from "./Home";

export default function SearchPage() {
  const { content } = useCatalog();
  const [params] = useSearchParams();
  const q = (params.get("q") || "").trim();
  const query = q.toLowerCase();
  const match = (text) => String(text || "").toLowerCase().includes(query);

  const products = query
    ? visibleProducts(content).filter((item) => match(`${item.name} ${item.blurb} ${item.description}`))
    : [];
  const tools = query
    ? visibleTools(content).filter((item) => match(`${item.name} ${item.blurb} ${item.description}`))
    : [];
  const guides = query
    ? visibleGuides(content).filter((item) => match(`${item.title} ${item.excerpt}`))
    : [];

  useSeo(content, {
    title: q ? `Search “${q}” — ${content.brand.name}` : `Search — ${content.brand.name}`,
    description: "Search products, tools, and guides.",
    path: `/search${q ? `?q=${encodeURIComponent(q)}` : ""}`,
  });

  const empty = query && products.length + tools.length + guides.length === 0;

  return (
    <div className="page">
      <header className="page-banner">
        <p className="eyebrow">Search</p>
        <h1>{q ? `Results for “${q}”` : "Search the desk."}</h1>
        <p className="lede">Products, calculators, and guides in one list.</p>
      </header>
      <section className="section wrap">
        {!query && <p>Type in the header search to look across the shop, the tools, and the guides.</p>}
        {empty && (
          <div className="empty">
            <h2>Nothing matches.</h2>
            <p>Try a shorter word, or open the shop and the tools from the menu.</p>
          </div>
        )}
        {products.length > 0 && (
          <>
            <h2>Products</h2>
            <div className="card-grid">
              {products.map((product) => (
                <ProductCard key={product.slug} product={product} category={productCategoryById(content, product.category)?.name} currency={content.brand.currency} />
              ))}
            </div>
          </>
        )}
        {tools.length > 0 && (
          <>
            <h2>Tools</h2>
            <div className="card-grid">
              {tools.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} category={categoryById(content, tool.category)?.name} />
              ))}
            </div>
          </>
        )}
        {guides.length > 0 && (
          <>
            <h2>Guides</h2>
            <div className="guide-list">
              {guides.map((guide) => (
                <Link key={guide.slug} to={`/guides/${guide.slug}`} className="guide-card">
                  <h2>{guide.title}</h2>
                  <p>{guide.excerpt}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
