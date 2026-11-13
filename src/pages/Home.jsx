import { Link } from "react-router-dom";
import { useCatalog } from "../catalog/context";
import { Region } from "../components/Region";
import SmartLink from "../components/SmartLink";
import ProductCard from "../components/ProductCard";
import { brandVars, categoryById, countInCategory, countInProductCategory, featuredProducts, featuredTools, fill } from "../data/store";
import { useSeo } from "../useSeo";

export default function Home() {
  const { content } = useCatalog();
  const vars = brandVars(content);
  const home = content.home;
  useSeo(content, { path: "/" });
  const stage = featuredTools(content).slice(0, 4);
  const align = content.layout?.bannerAlign || "left";
  const heroHeight = Math.max(0, Math.round(Number(content.layout?.heroHeight) || 0));

  return (
    <div className="page home">
      {home.hero.show && (
        <Region id="home-hero">
          <section className={`hero align-${align} ${heroHeight ? "is-sized" : ""}`} style={heroHeight ? { "--hero-h": `${heroHeight}px` } : undefined}>
            <div className="hero-copy">
              {home.hero.eyebrow && <p className="eyebrow">{fill(home.hero.eyebrow, vars)}</p>}
              <h1>
                {fill(home.hero.title, vars)
                  .split("\n")
                  .map((line, index) => (
                    <span key={index}>
                      {index > 0 && <br />}
                      {line}
                    </span>
                  ))}
              </h1>
              {home.hero.lede && <p className="lede">{fill(home.hero.lede, vars)}</p>}
              <div className="hero-actions">
                {home.hero.primaryLabel && (
                  <SmartLink className="btn btn-ember" to={home.hero.primaryTo}>
                    {fill(home.hero.primaryLabel, vars)}
                  </SmartLink>
                )}
                {home.hero.secondaryLabel && (
                  <SmartLink className="btn btn-light" to={home.hero.secondaryTo}>
                    {fill(home.hero.secondaryLabel, vars)}
                  </SmartLink>
                )}
              </div>
              {home.hero.showStats && (
                <ul className="hero-stats">
                  {home.hero.stats.map((stat) => (
                    <li key={stat.label}>
                      <strong>{fill(stat.value, vars)}</strong>
                      <span>{stat.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {home.hero.showStage && stage.length > 0 && (
              <div className="cluster" aria-label="Featured tools">
                {stage.map((tool) => (
                  <Link key={tool.slug} to={`/tools/${tool.slug}`} className="tile" style={{ "--tone": tool.tone }}>
                    <span>{categoryById(content, tool.category)?.name}</span>
                    <strong>{tool.name}</strong>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </Region>
      )}

      {home.marquee.show && home.marquee.phrases.length > 0 && (
        <Region id="home-marquee">
          <div className="marquee" aria-hidden="true">
            <div className="marquee-track">
              {[...home.marquee.phrases, ...home.marquee.phrases].map((phrase, index) => (
                <span key={`${phrase}-${index}`}>{fill(phrase, vars)}</span>
              ))}
            </div>
          </div>
        </Region>
      )}

      {home.categories.show && (
        <Region id="home-categories">
          <section className="section wrap">
            <div className="section-head">
              <div>
                <p className="eyebrow">{home.categories.kicker}</p>
                <h2>{fill(home.categories.title, vars)}</h2>
              </div>
              <SmartLink className="text-link" to={home.categories.linkTo}>
                {home.categories.linkLabel}
              </SmartLink>
            </div>
            <div className="cat-grid">
              {content.categories.map((category) => (
                <Link key={category.id} className="cat-tile" to={`/tools?category=${category.id}`}>
                  <span>{countInCategory(content, category.id)} tools</span>
                  <strong>{category.name}</strong>
                  <p>{category.blurb}</p>
                </Link>
              ))}
            </div>
          </section>
        </Region>
      )}

      {home.featured.show && (
        <Region id="home-featured">
          <section className="section wrap">
            <div className="section-head">
              <div>
                <p className="eyebrow">{home.featured.kicker}</p>
                <h2>{fill(home.featured.title, vars)}</h2>
              </div>
              <SmartLink className="text-link" to={home.featured.linkTo}>
                {home.featured.linkLabel}
              </SmartLink>
            </div>
            <div className="card-grid">
              {featuredTools(content).map((tool) => (
                <ToolCard key={tool.slug} tool={tool} category={categoryById(content, tool.category)?.name} />
              ))}
            </div>
          </section>
        </Region>
      )}

      {home.shop?.show && (
        <Region id="home-shop">
          <section className="section wrap">
            <div className="section-head">
              <div>
                <p className="eyebrow">{home.shop.kicker}</p>
                <h2>{fill(home.shop.title, vars)}</h2>
              </div>
              <SmartLink className="text-link" to={home.shop.linkTo}>
                {home.shop.linkLabel}
              </SmartLink>
            </div>
            <div className="cat-grid">
              {(content.productCategories || []).map((category) => (
                <Link key={category.id} className="cat-tile" to={`/shop?category=${category.id}`}>
                  <span>{countInProductCategory(content, category.id)} products</span>
                  <strong>{category.name}</strong>
                  <p>{category.blurb}</p>
                </Link>
              ))}
            </div>
            <div className="card-grid">
              {featuredProducts(content).map((product) => (
                <ProductCard
                  key={product.slug}
                  product={product}
                  category={(content.productCategories || []).find((item) => item.id === product.category)?.name}
                  currency={content.brand.currency}
                />
              ))}
            </div>
          </section>
        </Region>
      )}

      {home.steps.show && (
        <Region id="home-steps">
          <section className="section wrap">
            <p className="eyebrow">{home.steps.kicker}</p>
            <h2>{home.steps.title}</h2>
            <ol className="steps">
              {home.steps.items.map((step, index) => (
                <li key={step.title}>
                  <span>0{index + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </section>
        </Region>
      )}

      {home.close.show && (
        <Region id="home-close">
          <section className="close-band wrap">
            <p className="eyebrow">{fill(home.close.eyebrow, vars)}</p>
            <h2>{fill(home.close.title, vars)}</h2>
            <SmartLink className="btn btn-light" to={home.close.url}>
              {fill(home.close.label, vars)}
            </SmartLink>
          </section>
        </Region>
      )}
    </div>
  );
}

export function ToolCard({ tool, category }) {
  return (
    <Link className="tool-card" to={`/tools/${tool.slug}`}>
      <span className="card-face" style={{ "--tone": tool.tone }}>
        <i />
      </span>
      {category && <span className="kicker">{category}</span>}
      <strong>{tool.name}</strong>
      <p>{tool.blurb}</p>
    </Link>
  );
}
