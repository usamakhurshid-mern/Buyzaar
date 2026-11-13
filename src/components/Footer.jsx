import { useState } from "react";
import { useCatalog } from "../catalog/context";
import { fill } from "../data/store";
import SmartLink from "./SmartLink";

export default function Footer() {
  const { content } = useCatalog();
  const footer = content.footer;
  if (footer?.show === false) return null;
  const align = footer.align === "layout" ? content.layout?.footerAlign || "left" : footer.align;
  const logo = footer.logo || content.brand.logo;
  const socials = (footer.socials || []).filter((item) => item.url && item.label);

  return (
    <footer className={`footer tone-${footer.tone} design-${footer.design} align-${align}`}>
      <div className="footer-inner">
        <div className="footer-brand">
          {logo ? <img className="logo-image footer-logo" src={logo} alt="" /> : null}
          {content.brand.showName !== false && <strong>{content.brand.name}</strong>}
          {footer.lead && <p>{fill(footer.lead, { name: content.brand.name, currency: content.brand.currency })}</p>}
          {footer.showSocials && socials.length > 0 && (
            <div className="socials">
              {socials.map((item) => (
                <SmartLink key={item.id || item.url} to={item.url}>
                  {item.label}
                </SmartLink>
              ))}
            </div>
          )}
        </div>
        <div className="footer-columns">
          {(footer.columns || []).map((column) => (
            <div key={column.id || column.title}>
              <h2>{column.title}</h2>
              <ul>
                {(column.links || []).map((link) => (
                  <li key={link.id || link.to}>
                    <SmartLink to={link.to}>{link.label}</SmartLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {footer.newsletter?.show && <Newsletter newsletter={footer.newsletter} />}
      </div>
      <div className="legal">
        <span>{fill(footer.copyright, { name: content.brand.name })}</span>
      </div>
    </footer>
  );
}

function Newsletter({ newsletter }) {
  const [sent, setSent] = useState(false);
  return (
    <form
      className="newsletter"
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
      }}
    >
      <h2>{newsletter.title}</h2>
      <p className="fine">{newsletter.note}</p>
      <div className="news-row">
        <label className="sr-only" htmlFor="news-email">
          Email
        </label>
        <input id="news-email" type="email" required placeholder={newsletter.placeholder} />
        <button className="btn btn-ember" type="submit">
          {newsletter.button || "Join"}
        </button>
      </div>
      {sent && <p>{newsletter.thanks}</p>}
    </form>
  );
}
