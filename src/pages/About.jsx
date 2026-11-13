import { useCatalog } from "../catalog/context";
import { Region } from "../components/Region";
import { useSeo } from "../useSeo";

export default function About() {
  const { content } = useCatalog();
  const about = content.about;
  useSeo(content, {
    title: `${about.title} — ${content.brand.name}`,
    description: about.lede,
    path: "/about",
  });

  return (
    <div className="page">
      <header className="page-banner">
        <p className="eyebrow">{about.kicker}</p>
        <h1>{about.title}</h1>
        <p className="lede">{about.lede}</p>
      </header>
      <Region id="about-body">
        <article className="section wrap story">
          {about.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {String(section.body || "").split(/\n\n+/).filter(Boolean).map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </section>
          ))}
          {about.faq?.length > 0 && (
            <section id="faq">
              <h2>Questions</h2>
              <div className="faq">
                {about.faq.map((item) => (
                  <details key={item.q}>
                    <summary>{item.q}</summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
          <section id="contact">
            <h2>{about.contactTitle}</h2>
            <p>{about.contactText}</p>
            {content.brand.email ? <p><a href={`mailto:${content.brand.email}`}>{content.brand.email}</a></p> : <p className="fine">No email is set yet.</p>}
          </section>
        </article>
      </Region>
    </div>
  );
}
