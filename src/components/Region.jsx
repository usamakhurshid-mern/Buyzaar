import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useCatalog } from "../catalog/context";
import { adOnPage, pageKey } from "../data/ads";

function pageAds(content, pathname) {
  const editing = window.parent !== window;
  const page = pageKey(pathname);
  const ads = (content?.ads || []).filter((item) => item.show && adOnPage(item, page) && (editing || String(item.script || "").trim()));
  return { ads, editing, page };
}

export function usePageAd() {
  const { content } = useCatalog();
  const { pathname } = useLocation();
  return pageAds(content, pathname);
}

export function Region({ id, children }) {
  const { ads, editing } = usePageAd();
  const before = ads.filter((ad) => ad.place === id && ad.edge === "before");
  const after = ads.filter((ad) => ad.place === id && ad.edge !== "before");
  return (
    <div className="region" data-region={id}>
      {before.map((ad) => <AdBox key={ad.id} ad={ad} editing={editing} />)}
      {children}
      {after.map((ad) => <AdBox key={ad.id} ad={ad} editing={editing} />)}
    </div>
  );
}

export function AdInbox({ place }) {
  const { ads, editing } = usePageAd();
  const loose = ads.filter((ad) => !ad.place);
  if (place === "edit" && !editing) return null;
  if (place === "live" && editing) return null;
  if (!loose.length) return null;
  return loose.map((ad) => <AdBox key={ad.id} ad={ad} editing={editing} />);
}

function report(ad, detail) {
  if (window.parent === window) return;
  window.parent.postMessage({ type: "buyzaar-ad-layout", id: ad.id, ...detail }, window.location.origin);
}

function clearDrops() {
  document.querySelectorAll(".region.drop-before, .region.drop-after").forEach((node) => {
    node.classList.remove("drop-before", "drop-after");
  });
}

function regionUnder(x, y, slot) {
  slot.style.pointerEvents = "none";
  const hit = document.elementFromPoint(x, y);
  slot.style.pointerEvents = "";
  const region = hit?.closest?.("[data-region]");
  if (!region) return null;
  const box = region.getBoundingClientRect();
  const edge = y < box.top + box.height / 2 ? "before" : "after";
  return { place: region.dataset.region, edge, region };
}

function AdBox({ ad, editing }) {
  const slot = useRef(null);

  function startMove(event) {
    if (!editing || event.target.closest(".ad-resize")) return;
    event.preventDefault();
    const node = slot.current;
    try { node.setPointerCapture(event.pointerId); } catch { /* Synthetic preview events have no capture. */ }
    node.classList.add("is-dragging");
    let next = null;

    function move(pointer) {
      const found = regionUnder(pointer.clientX, pointer.clientY, node);
      clearDrops();
      if (!found) {
        next = null;
        return;
      }
      next = { place: found.place, edge: found.edge };
      found.region.classList.add(found.edge === "before" ? "drop-before" : "drop-after");
    }

    function up() {
      node.classList.remove("is-dragging");
      clearDrops();
      if (next) report(ad, next);
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerup", up);
    }

    node.addEventListener("pointermove", move);
    node.addEventListener("pointerup", up);
  }

  function startResize(event) {
    event.preventDefault();
    event.stopPropagation();
    const node = slot.current;
    const parent = node.parentElement;
    const parentWidth = parent.getBoundingClientRect().width || 1;
    const startX = event.clientX;
    const startY = event.clientY;
    const startW = node.getBoundingClientRect().width;
    const startH = node.getBoundingClientRect().height;
    const handle = event.currentTarget;
    try { handle.setPointerCapture(event.pointerId); } catch { /* Synthetic preview events have no capture. */ }

    function move(pointer) {
      const w = Math.min(100, Math.max(20, ((startW + pointer.clientX - startX) / parentWidth) * 100));
      const h = Math.min(1400, Math.max(80, startH + pointer.clientY - startY));
      node.style.width = `${w}%`;
      node.style.height = `${h}px`;
      node.dataset.w = String(Math.round(w * 10) / 10);
      node.dataset.h = String(Math.round(h));
    }

    function up() {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      report(ad, { w: Number(node.dataset.w), h: Number(node.dataset.h) });
    }

    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
  }

  return (
    <aside
      ref={slot}
      className={editing ? "ad-slot is-editing" : "ad-slot"}
      style={{ width: `${ad.w}%`, height: ad.h }}
      aria-label={ad.name || "Advertisement"}
      onPointerDown={startMove}
    >
      {editing && <span className="ad-label">{ad.place ? ad.name : `${ad.name} · drag onto a section`}</span>}
      {String(ad.script || "").trim() ? <AdEmbed script={ad.script} /> : editing ? <p>Paste an embed. Drag this box onto the page, and drag the corner to resize.</p> : null}
      {editing && <span className="ad-resize" role="separator" aria-label="Resize ad" onPointerDown={startResize} />}
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
