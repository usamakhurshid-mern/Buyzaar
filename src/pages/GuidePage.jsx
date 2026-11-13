import { Link, useParams } from "react-router-dom";
import { useCatalog } from "../catalog/context";
import { Region } from "../components/Region";
import SmartLink from "../components/SmartLink";
import { visibleGuides } from "../data/store";
import { useSeo } from "../useSeo";

export default function GuidePage() {
  const { slug } = useParams();
  const { content } = useCatalog();
  const guide = visibleGuides(content).find((item) => item.slug === slug);

  useSeo(content, guide
    ? { title: `${guide.title} — ${content.brand.name}`, description: guide.excerpt, path: `/guides/${guide.slug}` }
    : { title: `Missing guide — ${content.brand.name}`, description: "That guide is not published.", path: `/guides/${slug}`, robots: "noindex,follow" });

  if (!guide) {
    return (
      <div className="page">
        <header className="page-banner">
          <p className="eyebrow">Missing guide</p>
          <h1>That page is not on the desk.</h1>
          <p className="lede">It may be hidden, or the link is out of date.</p>
          <SmartLink className="btn btn-light" to="/guides">
            Back to guides
          </SmartLink>
        </header>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-banner">
        <p className="eyebrow">Guide</p>
        <h1>{guide.title}</h1>
        {guide.excerpt && <p className="lede">{guide.excerpt}</p>}
      </header>
      <Region id="guide-body">
        <article className="section wrap story guide-body">
          {guide.sections.map((section) => (
            <section key={section.heading || section.body.slice(0, 24)}>
              {section.heading && <h2>{section.heading}</h2>}
              {section.body.split(/\n\n+/).filter(Boolean).map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </section>
          ))}
          <p className="guide-links">
            {guide.slug === "how-to-compare-phones" && (
              <>
                <Link className="text-link" to="/shop?category=phones">Browse phones</Link>
                <Link className="text-link" to="/compare">Open compare</Link>
              </>
            )}
            <Link className="text-link" to="/tools">Open a calculator</Link>
          </p>
        </article>
      </Region>
    </div>
  );
}
