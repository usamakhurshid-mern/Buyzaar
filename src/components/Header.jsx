import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCompare } from "../compare";
import { useCatalog } from "../catalog/context";
import { headerDesignMap } from "../data/chrome";
import { fill, navItemActive } from "../data/store";
import SmartLink from "./SmartLink";

export default function Header() {
  const { content, mode, setMode } = useCatalog();
  const location = useLocation();
  const navigate = useNavigate();
  const compareCount = useCompare().length;
  const urlQuery = new URLSearchParams(location.search).get("q") || "";
  const routeKey = `${location.pathname}${location.search}`;
  const [scrolled, setScrolled] = useState(() => window.scrollY > 8);
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState(urlQuery);
  const [trackedQuery, setTrackedQuery] = useState(urlQuery);
  const [trackedRoute, setTrackedRoute] = useState(routeKey);

  if (urlQuery !== trackedQuery) {
    setTrackedQuery(urlQuery);
    setQuery(urlQuery);
  }
  if (trackedRoute !== routeKey) {
    setTrackedRoute(routeKey);
    if (menu) setMenu(false);
  }

  useEffect(() => {
    const bar = document.querySelector(".promo");
    const root = document.documentElement;
    if (!bar) {
      root.style.setProperty("--promo-h", "0px");
      return undefined;
    }
    const apply = () => root.style.setProperty("--promo-h", `${bar.offsetHeight}px`);
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [content.announcement.show, content.announcement.text, content.announcement.linkLabel]);

  useEffect(() => {
    const node = document.querySelector(".header");
    if (!node) return undefined;
    const apply = () => document.documentElement.style.setProperty("--header-h", `${node.offsetHeight}px`);
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(node);
    return () => observer.disconnect();
  }, [content.header.design, content.header.bar]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);

  function onSearch(event) {
    event.preventDefault();
    const term = query.trim();
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
    setMenu(false);
  }

  const { announcement, brand, header } = content;
  const design = headerDesignMap[header.design] || headerDesignMap.balanced;
  const items = (header.items || []).filter((item) => item.show !== false);
  const stacked = header.design === "stacked";

  const pieces = {
    logo: <Logo key="logo" brand={brand} />,
    menu: (
      <nav key="menu" className="desk-nav" aria-label="Primary">
        {items.map((item) => (
          <NavItem key={item.id} item={item} location={location} />
        ))}
      </nav>
    ),
    search: (
      <form key="search" className="search desk-search" role="search" onSubmit={onSearch}>
        <label className="sr-only" htmlFor="site-search">
          Search the site
        </label>
        <input id="site-search" type="search" value={query} placeholder={header.searchPlaceholder} onChange={(event) => setQuery(event.target.value)} />
        <button type="submit" aria-label="Search">
          Search
        </button>
      </form>
    ),
  };

  return (
    <div className="top-stack">
      {announcement.show && (
        <div className="promo">
          <span>{fill(announcement.text, { name: brand.name, tagline: brand.tagline })}</span>
          {announcement.linkLabel && announcement.linkUrl ? (
            <SmartLink to={announcement.linkUrl}>{announcement.linkLabel}</SmartLink>
          ) : null}
        </div>
      )}
      <header className={`header bar-${header.bar} links-${header.links} ${stacked ? "is-stacked" : ""} ${scrolled ? "is-scrolled" : ""}`}>
        <div className="bar-inner">
          {stacked ? (
            <>
              {pieces.logo}
              {pieces.menu}
              <div className="slot end">
                {header.showSearch ? pieces.search : null}
                <CompareChip count={compareCount} />
                <ModeButton mode={mode} setMode={setMode} />
                <button type="button" className="menu-btn" aria-expanded={menu} onClick={() => setMenu((open) => !open)}>
                  {menu ? "Close" : "Menu"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="slot">{design.order.filter((key) => placeOf(header, design, key) === "left" && (key !== "search" || header.showSearch)).map((key) => pieces[key])}</div>
              <div className="slot center">{design.order.filter((key) => placeOf(header, design, key) === "center" && (key !== "search" || header.showSearch)).map((key) => pieces[key])}</div>
              <div className="slot end">
                {design.order.filter((key) => placeOf(header, design, key) === "right" && (key !== "search" || header.showSearch)).map((key) => pieces[key])}
                <CompareChip count={compareCount} />
                <ModeButton mode={mode} setMode={setMode} />
                <button type="button" className="menu-btn" aria-expanded={menu} onClick={() => setMenu((open) => !open)}>
                  {menu ? "Close" : "Menu"}
                </button>
              </div>
            </>
          )}
        </div>
      </header>
      {menu && (
        <div className="drawer">
          <form className="search" role="search" onSubmit={onSearch}>
            <label className="sr-only" htmlFor="drawer-search">
              Search the site
            </label>
            <input id="drawer-search" type="search" value={query} placeholder={header.searchPlaceholder} onChange={(event) => setQuery(event.target.value)} />
            <button type="submit">Search</button>
          </form>
          <nav aria-label="Mobile">
            {items.map((item) => (
              <div key={item.id} className="drawer-group">
                <SmartLink to={item.to || "/"} onClick={() => setMenu(false)}>
                  {item.label}
                </SmartLink>
                {(item.children || [])
                  .filter((child) => child.show !== false)
                  .map((child) => (
                    <SmartLink key={child.id} to={child.to} onClick={() => setMenu(false)}>
                      {child.label}
                    </SmartLink>
                  ))}
              </div>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}

function placeOf(header, design, key) {
  return design[key] || "left";
}

function NavItem({ item, location }) {
  const active = navItemActive(item, location);
  if (item.type === "dropdown") {
    const children = (item.children || []).filter((child) => child.show !== false);
    return (
      <div className="nav-drop">
        <SmartLink to={item.to || "/tools"} className={active ? "nav-link active" : "nav-link"}>
          {item.label}
        </SmartLink>
        <div className="menu">
          {children.map((child) => (
            <SmartLink key={child.id} to={child.to}>
              {child.label}
            </SmartLink>
          ))}
        </div>
      </div>
    );
  }
  return (
    <SmartLink to={item.to || "/"} className={active ? "nav-link active" : "nav-link"}>
      {item.label}
    </SmartLink>
  );
}

function Logo({ brand }) {
  return (
    <SmartLink to="/" className="logo">
      {brand.logo ? <img className="logo-image" src={brand.logo} alt="" /> : null}
      {brand.showName !== false && <span>{brand.name}</span>}
    </SmartLink>
  );
}

function CompareChip({ count }) {
  return (
    <SmartLink className="compare-chip" to="/compare">
      Compare{count ? ` ${count}` : ""}
    </SmartLink>
  );
}

function ModeButton({ mode, setMode }) {
  const dark = mode === "dark";
  return (
    <button type="button" className="mode-btn" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={() => setMode(dark ? "light" : "dark")}>
      {dark ? "Light" : "Dark"}
    </button>
  );
}
