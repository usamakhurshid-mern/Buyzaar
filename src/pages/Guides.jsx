import { Link } from "react-router-dom";
import { useCatalog } from "../catalog/context";
import { Region } from "../components/Region";
import { visibleGuides } from "../data/store";
import { useSeo } from "../useSeo";

export default function Guides() {
  const { content } = useCatalog();
  const page = content.guidesPage;
  const guides = visibleGuides(content);
  useSeo(content, {
    title: `${page.title} — ${content.brand.name}`,
    description: page.lede,
    path: "/guides",
  });

  return (
    <div className="page">
      <Region id="guides-list">
        <header className="page-banner">
          <p className="eyebrow">{page.kicker}</p>
          <h1>{page.title}</h1>
          <p className="lede">{page.lede}</p>
        </header>
        <section className="section wrap guide-list">
          {guides.length === 0 ? (
            <div className="empty">
              <h2>{page.emptyTitle}</h2>
              <p>{page.emptyText}</p>
            </div>
          ) : (
            guides.map((guide) => (
              <Link key={guide.slug} to={`/guides/${guide.slug}`} className="guide-card">
                <h2>{guide.title}</h2>
                <p>{guide.excerpt}</p>
              </Link>
            ))
          )}
        </section>
      </Region>
    </div>
  );
}
