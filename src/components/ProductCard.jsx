import { Link } from "react-router-dom";
import { COMPARE_LIMIT, toggleCompare, useCompare } from "../compare";
import { money } from "../tools/calc";

export default function ProductCard({ product, category, currency }) {
  const picked = useCompare();
  const on = picked.includes(product.slug);
  const full = !on && picked.length >= COMPARE_LIMIT;

  return (
    <article className="product-card">
      <Link to={`/shop/${product.slug}`}>
        <span className="product-swatch" style={{ "--tone": product.tone || "var(--ember)" }} />
        {category && <span className="kicker">{category}</span>}
        <strong>{product.name}</strong>
        <p>{product.blurb}</p>
        <b>{money(product.price, currency)}</b>
      </Link>
      <button
        type="button"
        className={on ? "btn btn-ember" : "btn btn-line"}
        disabled={full}
        onClick={() => toggleCompare(product.slug)}
      >
        {on ? "In compare" : full ? "Compare is full" : "Compare"}
      </button>
    </article>
  );
}
