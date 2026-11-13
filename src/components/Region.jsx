import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useCatalog } from "../catalog/context";
import { adOnPage, pageKey } from "../data/ads";

export function usePageAd() {
  const { content } = useCatalog();
  const { pathname } = useLocation();
  const editing = window.parent !== window;
  const page = pageKey(pathname);
  const ad = (content?.ads || []).find((item) => item.show && adOnPage(item, page) && (editing || String(item.script || "").trim()));
  return { ad, editing, page };
}

export function Region({ id, children }) {
  const { ad, editing } = usePageAd();
  const before = ad && ad.place === id && ad.edge === "before";
  const after = ad && ad.place === id && ad.edge !== "before";
  return (
    <div className="region">
      {before ? <AdBox ad={ad} editing={editing} /> : null}
      {children}
      {after ? <AdBox ad={ad} editing={editing} /> : null}
    </div>
  );
}

export function AdInbox({ place }) {
  const { ad, editing } = usePageAd();
  const loose = ad && !ad.place;
  if (place === "edit" && !(editing && loose)) return null;
  if (place === "live" && !(!editing && loose)) return null;
  return <AdBox ad={ad} editing={editing} />;
}

function AdBox({ ad, editing }) {
  return (
    <aside className="ad-slot" style={{ width: `${ad.w}%`, height: ad.h }} aria-label={ad.name || "Advertisement"}>
      {String(ad.script || "").trim() ? <AdEmbed script={ad.script} /> : editing ? <p>This box is empty until an embed is pasted.</p> : null}
    </aside>
  );
}

function AdEmbed({ script }) {
  const ref = useRef(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return undefined;
    host.replaceChildren();
    const holder = document.createElement("div");
    holder.innerHTML = script;
    const scripts = [...holder.querySelectorAll("script")];
    scripts.forEach((node) => node.remove());
    host.appendChild(holder);
    scripts.forEach((old) => {
      const next = document.createElement("script");
      [...old.attributes].forEach((attr) => next.setAttribute(attr.name, attr.value));
      next.async = false;
      next.text = old.textContent || "";
      host.appendChild(next);
    });
    return () => host.replaceChildren();
  }, [script]);

  return <div className="ad-fill" ref={ref} />;
}
