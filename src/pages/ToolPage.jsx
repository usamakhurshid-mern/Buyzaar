import { Link, useParams } from "react-router-dom";
import { useCatalog } from "../catalog/context";
import { Region } from "../components/Region";
import SmartLink from "../components/SmartLink";
import { categoryById, visibleTools } from "../data/store";
import { mergeSettings, money, slabLabel } from "../tools/calc";
import ToolForm from "../tools/ToolForm";
import { useSeo } from "../useSeo";

export default function ToolPage() {
  const { slug } = useParams();
  const { content } = useCatalog();
  const tool = visibleTools(content).find((item) => item.slug === slug);
  const page = content.toolPage;

  useSeo(content, tool
    ? {
        title: tool.seoTitle || `${tool.name} — ${content.brand.name}`,
        description: tool.seoDescription || tool.blurb,
        path: `/tools/${tool.slug}`,
      }
    : {
        title: `${page.missingTitle} — ${content.brand.name}`,
        description: page.missingText,
        path: `/tools/${slug}`,
        robots: "noindex,follow",
      });

  if (!tool) {
    return (
      <div className="page">
        <header className="page-banner">
          <p className="eyebrow">{page.missingKicker}</p>
          <h1>{page.missingTitle}</h1>
          <p className="lede">{page.missingText}</p>
          <SmartLink className="btn btn-light" to="/tools">
            {page.missingButton}
          </SmartLink>
        </header>
      </div>
    );
  }

  const category = categoryById(content, tool.category);
  const settings = mergeSettings(tool);
  const related = visibleTools(content).filter((item) => item.category === tool.category && item.slug !== tool.slug).slice(0, 3);
  const paragraphs = String(tool.description || "").split(/\n\n+/).filter(Boolean);

  return (
    <div className="page">
      <Region id="tool-banner">
        <header className="page-banner">
          <p className="eyebrow">{category?.name || "Tool"}</p>
          <h1>{tool.name}</h1>
          <p className="lede">{tool.blurb}</p>
        </header>
      </Region>
      <Region id="tool-body">
        <article className="section wrap tool-layout">
          <ToolForm tool={tool} currency={content.brand.currency || "PKR"} />
          <div className="story">
            {paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
            {tool.kind === "zakat" && (
              <ul className="rate-list">
                <li>Gold sample: {money(settings.goldPerTola, content.brand.currency)} / tola · nisab {settings.goldNisabTola} tola</li>
                <li>Silver sample: {money(settings.silverPerTola, content.brand.currency)} / tola · nisab {settings.silverNisabTola} tola</li>
                <li>Rate {settings.rate}% once wealth is at or above the silver nisab</li>
              </ul>
            )}
            {tool.kind === "electricity" && (
              <ul className="rate-list">
                {settings.slabs.map((slab, index) => (
                  <li key={`${slab.upto}-${index}`}>
                    {slabLabel(slab, index, settings.slabs)} · {money(slab.rate, content.brand.currency)} per unit
                  </li>
                ))}
              </ul>
            )}
            <p className="fine">The working stays in this browser. Refreshing the page clears what you typed.</p>
          </div>
        </article>
      </Region>
      {related.length > 0 && (
        <section className="section wrap">
          <p className="eyebrow">{page.relatedKicker}</p>
          <h2>{page.relatedTitle}</h2>
          <div className="card-grid">
            {related.map((item) => (
              <Link key={item.slug} className="tool-card" to={`/tools/${item.slug}`}>
                <span className="card-face" style={{ "--tone": item.tone }} />
                <strong>{item.name}</strong>
                <p>{item.blurb}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
