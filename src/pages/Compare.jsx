import { Link } from "react-router-dom";
import { useCompare, writeCompare } from "../compare";
import { useCatalog } from "../catalog/context";
import { Region } from "../components/Region";
import SmartLink from "../components/SmartLink";
import { visibleProducts } from "../data/store";
import { money } from "../tools/calc";
import { useSeo } from "../useSeo";

export default function Compare() {
  const { content } = useCatalog();
  const slugs = useCompare();
  const products = slugs.map((slug) => visibleProducts(content).find((item) => item.slug === slug)).filter(Boolean);
  const labels = [];
  products.forEach((product) => {
    (product.specs || []).forEach((spec) => {
      if (spec.label && !labels.includes(spec.label)) labels.push(spec.label);
    });
  });

  useSeo(content, {
    title: `Compare — ${content.brand.name}`,
    description: "Put up to three products side by side.",
    path: "/compare",
  });

  return (
    <div className="page">
      <Region id="compare-body">
        <header className="page-banner">
          <p className="eyebrow">Compare</p>
          <h1>Side by side.</h1>
          <p className="lede">Pick two or three products from the shop. The table lines up every spec they publish. Missing specs stay blank.</p>
        </header>
        <section className="section wrap">
          {products.length < 2 ? (
            <div className="empty">
              <h2>{products.length === 0 ? "Nothing is selected." : "Add one more."}</h2>
              <p>Comparison needs at least two products. The shop holds the list, and three is the maximum.</p>
              <SmartLink className="btn btn-ember" to="/shop">Browse products</SmartLink>
            </div>
          ) : (
            <div className="compare-scroll">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>Spec</th>
                    {products.map((product) => (
                      <th key={product.slug}>
                        <Link to={`/shop/${product.slug}`}>{product.name}</Link>
                        <span>{money(product.price, content.brand.currency)}</span>
                        <button type="button" className="btn btn-line" onClick={() => writeCompare(slugs.filter((slug) => slug !== product.slug))}>
                          Remove
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {labels.map((label) => (
                    <tr key={label}>
                      <th>{label}</th>
                      {products.map((product) => (
                        <td key={product.slug}>{(product.specs || []).find((spec) => spec.label === label)?.value || "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </Region>
    </div>
  );
}
