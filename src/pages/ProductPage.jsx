import { Link, useParams } from "react-router-dom";
import { COMPARE_LIMIT, toggleCompare, useCompare } from "../compare";
import { useCatalog } from "../catalog/context";
import ProductCard from "../components/ProductCard";
import { Region } from "../components/Region";
import SmartLink from "../components/SmartLink";
import { productCategoryById, visibleProducts } from "../data/store";
import { money } from "../tools/calc";
import { useSeo } from "../useSeo";

export default function ProductPage() {
  const { slug } = useParams();
  const { content } = useCatalog();
  const page = content.shop;
  const product = visibleProducts(content).find((item) => item.slug === slug);
  const picked = useCompare();

  useSeo(content, product
    ? {
        title: product.seoTitle || `${product.name} — ${content.brand.name}`,
        description: product.seoDescription || product.blurb,
        path: `/shop/${product.slug}`,
      }
    : { title: `Missing product — ${content.brand.name}`, description: page.missingText, path: `/shop/${slug}`, robots: "noindex,follow" });

  if (!product) {
    return (
      <div className="page">
        <header className="page-banner">
          <p className="eyebrow">Missing product</p>
          <h1>{page.missingTitle}</h1>
          <p className="lede">{page.missingText}</p>
          <SmartLink className="btn btn-line" to="/shop">{page.missingButton}</SmartLink>
        </header>
      </div>
    );
  }

  const category = productCategoryById(content, product.category);
  const on = picked.includes(product.slug);
  const full = !on && picked.length >= COMPARE_LIMIT;
  const related = visibleProducts(content).filter((item) => item.category === product.category && item.slug !== product.slug).slice(0, 3);
  const paragraphs = String(product.description || "").split(/\n\n+/).filter(Boolean);

  return (
    <div className="page">
      <Region id="product-banner">
        <header className="page-banner">
          <p className="eyebrow">{category?.name || "Product"}</p>
          <h1>{product.name}</h1>
          <p className="lede">{product.blurb}</p>
          <p className="price-line">{money(product.price, content.brand.currency)}</p>
        </header>
      </Region>
      <Region id="product-body">
        <article className="section wrap tool-layout">
          <div className="calc product-side">
            <span className="product-swatch tall" style={{ "--tone": product.tone || "var(--ember)" }} />
            <button type="button" className={on ? "btn btn-ember" : "btn btn-line"} disabled={full} onClick={() => toggleCompare(product.slug)}>
              {on ? "In compare" : full ? "Compare is full" : "Add to compare"}
            </button>
            {product.buyUrl ? (
              <SmartLink className="btn btn-ember" to={product.buyUrl}>{product.buyLabel || "Open the shop"}</SmartLink>
            ) : (
              <p className="fine">No shop link is set. Buyzaar does not take payment.</p>
            )}
          </div>
          <div className="story">
            {paragraphs.map((paragraph) => <p key={paragraph.slice(0, 40)}>{paragraph}</p>)}
            <table className="compare-table">
              <tbody>
                {(product.specs || []).map((spec) => (
                  <tr key={spec.label}>
                    <th>{spec.label}</th>
                    <td>{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="fine">Specs and the price are samples until they are edited. Compare up to three products from the shop.</p>
          </div>
        </article>
      </Region>
      {related.length > 0 && (
        <section className="section wrap">
          <p className="eyebrow">Same category</p>
          <h2>Others to put beside it.</h2>
          <div className="card-grid">
            {related.map((item) => (
              <ProductCard key={item.slug} product={item} category={category?.name} currency={content.brand.currency} />
            ))}
          </div>
          <p><Link className="text-link" to={`/shop?category=${product.category}`}>See the whole {category?.name || "category"}</Link></p>
        </section>
      )}
    </div>
  );
}
