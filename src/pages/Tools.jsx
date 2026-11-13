import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCatalog } from "../catalog/context";
import { Region } from "../components/Region";
import { categoryById, fill, visibleTools } from "../data/store";
import { useSeo } from "../useSeo";
import { ToolCard } from "./Home";

export default function Tools() {
  const { content } = useCatalog();
  const directory = content.directory;
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const sort = params.get("sort") || "featured";
  const current = categoryById(content, category);

  useSeo(content, {
    title: current ? `${current.name} tools — ${content.brand.name}` : `${directory.title} — ${content.brand.name}`,
    description: current?.blurb || directory.intro,
    path: `/tools${params.toString() ? `?${params}` : ""}`,
  });

  const tools = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = visibleTools(content).filter((tool) => {
      if (category && tool.category !== category) return false;
      if (!query) return true;
      const cat = categoryById(content, tool.category)?.name || "";
      return `${tool.name} ${tool.blurb} ${tool.description} ${cat}`.toLowerCase().includes(query);
    });
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else list = [...list].sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name));
    return list;
  }, [content, q, category, sort]);

  function update(next) {
    const merged = { q, category, sort, ...next };
    const clean = Object.fromEntries(Object.entries(merged).filter(([, value]) => value && value !== "featured"));
    if (merged.sort && merged.sort !== "featured") clean.sort = merged.sort;
    setParams(clean);
  }

  const title = current ? current.name : q ? `Results for “${q}”` : directory.title;

  return (
    <div className="page">
      <Region id="tools-banner">
        <header className="page-banner">
          <p className="eyebrow">{directory.kicker}</p>
          <h1>{fill(title, { name: content.brand.name })}</h1>
          <p className="lede">{current?.blurb || directory.intro}</p>
        </header>
      </Region>
      <Region id="tools-results">
        <div className="section wrap directory">
          {directory.showFilters !== false && (
            <aside className={`filters ${open ? "open" : ""}`}>
              <button type="button" className="filter-toggle" onClick={() => setOpen((value) => !value)}>
                {open ? directory.hideLabel : directory.showLabel}
              </button>
              <div className="filter-body">
                <label>
                  <span>Search</span>
                  <input value={q} placeholder={directory.searchPlaceholder} onChange={(event) => update({ q: event.target.value })} />
                </label>
                <label>
                  <span>Category</span>
                  <select value={category} onChange={(event) => update({ category: event.target.value })}>
                    <option value="">{directory.allLabel}</option>
                    {content.categories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Sort</span>
                  <select value={sort} onChange={(event) => update({ sort: event.target.value })}>
                    <option value="featured">{directory.sortFeatured}</option>
                    <option value="name">{directory.sortName}</option>
                  </select>
                </label>
              </div>
            </aside>
          )}
          <div>
            <p className="fine">
              {tools.length} {tools.length === 1 ? "tool" : "tools"}
            </p>
            {tools.length === 0 ? (
              <div className="empty">
                <h2>{directory.emptyTitle}</h2>
                <p>{directory.emptyText}</p>
                <button type="button" className="btn btn-ember" onClick={() => setParams({})}>
                  {directory.emptyButton}
                </button>
              </div>
            ) : (
              <div className="card-grid">
                {tools.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} category={categoryById(content, tool.category)?.name} />
                ))}
              </div>
            )}
          </div>
        </div>
      </Region>
    </div>
  );
}
