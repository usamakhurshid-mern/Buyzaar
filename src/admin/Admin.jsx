import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "../catalog/context";
import { pageOptions } from "../data/ads";
import { adPlaces, footerDesigns, headerDesigns } from "../data/chrome";
import { defaultContent } from "../data/defaultContent";
import { fontFamilies, fontRoles, normalizeFonts } from "../data/fonts";
import { ADMIN_KEY, applyTheme, moveItem, prepareContent, syncToolMenu, uid, validateContent } from "../data/store";
import { themes } from "../data/themes";
import { settingDefaults } from "../tools/calc";
import ProductsPanel from "./ProductsPanel";
import { useSeo } from "../useSeo";

const sections = [
  ["products", "Products"],
  ["tools", "Tools"],
  ["categories", "Categories"],
  ["guides", "Guides"],
  ["brand", "Brand"],
  ["themes", "Themes"],
  ["fonts", "Fonts"],
  ["announcement", "Announcement"],
  ["ads", "Ads"],
  ["navigation", "Navigation"],
  ["footer", "Footer"],
  ["home", "Home"],
  ["directory", "Tools page"],
  ["about", "About"],
  ["seo", "SEO"],
  ["layout", "Layout"],
];

const colors = [
  ["bg", "Page"],
  ["ink", "Text"],
  ["muted", "Secondary text"],
  ["paper", "Cards"],
  ["gold", "Labels"],
  ["ember", "Button"],
  ["stage", "Banner"],
  ["promoBg", "Announcement"],
  ["promoText", "Announcement text"],
  ["footerBg", "Footer"],
  ["footerText", "Footer text"],
];

export default function Admin() {
  const [authed, setAuthed] = useState(() => Boolean(sessionStorage.getItem(ADMIN_KEY)));
  const [notice, setNotice] = useState("");
  if (!authed) {
    return (
      <Login
        notice={notice}
        onSuccess={() => {
          setNotice("");
          setAuthed(true);
        }}
      />
    );
  }
  return (
    <Editor
      onLogout={(message) => {
        sessionStorage.removeItem(ADMIN_KEY);
        setNotice(message || "");
        setAuthed(false);
      }}
    />
  );
}

function Login({ onSuccess, notice }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(notice || "");
  const [pending, setPending] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const typed = String(new FormData(event.currentTarget).get("password") || password).trim();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: typed }),
      });
      if (response.status === 401) {
        setError("Wrong password.");
        return;
      }
      if (!response.ok) {
        setError("Open the admin while npm run dev is running.");
        return;
      }
      sessionStorage.setItem(ADMIN_KEY, typed);
      onSuccess();
    } catch {
      setError("The admin save service is not running. Start the site with npm run dev.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="admin-login">
      <form onSubmit={submit}>
        <p className="kicker">Buyzaar admin</p>
        <h1>Edit the desk.</h1>
        <p>Tools, guides, colors, and page copy. The public site reads one saved document.</p>
        <Text label="Password" type="password" name="password" value={password} onChange={setPassword} />
        {error && <p className="aerror">{error}</p>}
        <button className="btn btn-ember" type="submit" disabled={pending}>
          {pending ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}

function Editor({ onLogout }) {
  const { content, save } = useCatalog();
  const [draft, setDraft] = useState(() => structuredClone(content));
  const [baseline, setBaseline] = useState(() => JSON.stringify(content));
  const [section, setSection] = useState("tools");
  const [errors, setErrors] = useState([]);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(() => localStorage.getItem("buyzaar-preview") !== "off");
  const [path, setPath] = useState("/");
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const dirty = JSON.stringify(draft) !== baseline;
  const saving = useRef(false);

  useSeo(content, { title: `${draft.brand?.name || "Buyzaar"} admin`, description: "", robots: "noindex,nofollow", path: "/admin" });

  useEffect(() => {
    const onLeave = (event) => {
      if (JSON.stringify(draftRef.current) === baseline) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [baseline]);

  function patch(mutate) {
    setDraft((current) => {
      const next = structuredClone(current);
      mutate(next);
      return next;
    });
  }

  async function onSave() {
    if (saving.current) return;
    saving.current = true;
    setPending(true);
    setStatus("");
    try {
      let guard = 0;
      while (guard < 3) {
        guard += 1;
        const stamp = JSON.stringify(draftRef.current);
        const payload = prepareContent(draftRef.current);
        const problems = validateContent(payload);
        if (problems.length) {
          setErrors(problems);
          break;
        }
        await save(payload);
        if (JSON.stringify(draftRef.current) !== stamp) continue;
        setDraft(payload);
        setBaseline(JSON.stringify(payload));
        setErrors([]);
        setStatus("Saved. The live site matches this screen.");
        break;
      }
    } catch (error) {
      if (error.status === 401) onLogout(error.message || "Your session expired. Sign in again.");
      else setErrors([error.message || "Save failed."]);
    } finally {
      saving.current = false;
      setPending(false);
    }
  }

  const panel = {
    products: <ProductsPanel draft={draft} patch={patch} />,
    tools: <ToolsPanel draft={draft} patch={patch} />,
    categories: <CategoriesPanel draft={draft} patch={patch} />,
    guides: <GuidesPanel draft={draft} patch={patch} />,
    brand: <BrandPanel draft={draft} patch={patch} onLogout={onLogout} />,
    themes: <ThemesPanel draft={draft} patch={patch} />,
    fonts: <FontsPanel draft={draft} patch={patch} />,
    announcement: <AnnouncementPanel draft={draft} patch={patch} />,
    ads: <AdsPanel draft={draft} patch={patch} />,
    navigation: <NavPanel draft={draft} patch={patch} />,
    footer: <FooterPanel draft={draft} patch={patch} />,
    home: <HomePanel draft={draft} patch={patch} />,
    directory: <DirectoryPanel draft={draft} patch={patch} />,
    about: <AboutPanel draft={draft} patch={patch} />,
    seo: <SeoPanel draft={draft} patch={patch} />,
    layout: <LayoutPanel draft={draft} patch={patch} />,
  }[section];

  return (
    <div className={`admin-app ${previewOpen ? "" : "preview-hidden"}`}>
      <aside className="admin-side">
        <p className="admin-brand">Buyzaar</p>
        {sections.map(([id, label]) => (
          <button key={id} type="button" className={section === id ? "nav-item on" : "nav-item"} onClick={() => setSection(id)}>
            {label}
          </button>
        ))}
        <Link className="nav-item" to="/" onClick={(event) => dirty && !window.confirm("Leave without saving?") && event.preventDefault()}>
          View site
        </Link>
        <button type="button" className="nav-item" onClick={() => onLogout()}>
          Log out
        </button>
      </aside>
      <div className="admin-main">
        <div className="admin-scroll">
          <div className="admin-toolbar">
            <button
              type="button"
              className="btn btn-line"
              onClick={() => {
                const next = !previewOpen;
                setPreviewOpen(next);
                localStorage.setItem("buyzaar-preview", next ? "on" : "off");
              }}
            >
              {previewOpen ? "Hide preview" : "Show preview"}
            </button>
          </div>
          {panel}
        </div>
        <div className="asave">
          <p className={errors.length ? "aerror" : ""}>
            {errors.length ? errors.join(" ") : pending ? "Saving the latest draft…" : dirty ? "Unsaved edits stay in this draft until you press Save." : status || "The live site matches this screen."}
          </p>
          <button className="btn btn-ember" type="button" disabled={!dirty || pending} onClick={onSave}>
            Save
          </button>
        </div>
      </div>
      {previewOpen && <Preview draft={draft} path={path} setPath={setPath} />}
    </div>
  );
}

function Preview({ draft, path, setPath }) {
  const frame = useRef(null);
  const origin = window.location.origin;
  const tool = draft.tools?.find((item) => item.visible !== false && item.slug);
  const guide = draft.guides?.find((item) => item.visible !== false && item.slug);

  function publish(target = frame.current) {
    target?.contentWindow?.postMessage({ type: "buyzaar-preview", content: draft }, origin);
  }

  useEffect(() => {
    publish();
    function onMessage(event) {
      if (event.origin !== origin || event.data?.type !== "buyzaar-preview-ready") return;
      publish(frame.current);
      frame.current?.contentWindow?.postMessage({ type: "buyzaar-preview-go", path }, origin);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [draft, path]);

  return (
    <aside className="admin-preview">
      <div className="preview-bar">
        <strong>Live preview</strong>
        <select
          value={path}
          onChange={(event) => {
            setPath(event.target.value);
            frame.current?.contentWindow?.postMessage({ type: "buyzaar-preview-go", path: event.target.value }, origin);
          }}
        >
          <option value="/">Home</option>
          <option value="/shop">Shop</option>
          <option value={draft.products?.[0] ? `/shop/${draft.products[0].slug}` : "/shop"}>Product</option>
          <option value="/compare">Compare</option>
          <option value="/tools">Tools</option>
          <option value={tool ? `/tools/${tool.slug}` : "/tools"}>Tool</option>
          <option value="/guides">Guides</option>
          <option value={guide ? `/guides/${guide.slug}` : "/guides"}>Guide</option>
          <option value="/about">About</option>
        </select>
        <WidthSwitch frame={frame} />
      </div>
      <div className="preview-stage">
        <iframe
          ref={frame}
          title="Site preview"
          src="/?preview=1"
          onLoad={() => {
            publish();
            frame.current?.contentWindow?.postMessage({ type: "buyzaar-preview-go", path }, origin);
          }}
        />
      </div>
    </aside>
  );
}

function WidthSwitch({ frame }) {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    frame.current?.classList.toggle("phone", phone);
  }, [phone, frame]);
  return (
    <div className="preview-switch">
      <button type="button" className={phone ? "" : "on"} onClick={() => setPhone(false)}>
        Desktop
      </button>
      <button type="button" className={phone ? "on" : ""} onClick={() => setPhone(true)}>
        Phone
      </button>
    </div>
  );
}

function ToolsPanel({ draft, patch }) {
  const [index, setIndex] = useState(-1);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState([]);
  const tool = draft.tools[index];
  const rows = draft.tools.map((item, itemIndex) => ({ item, itemIndex })).filter(({ item }) => `${item.name} ${item.kind}`.toLowerCase().includes(query.trim().toLowerCase()));

  if (tool) {
    return (
      <div>
        <button type="button" className="text-link back" onClick={() => setIndex(-1)}>
          All tools
        </button>
        <h1>{tool.name || "Tool"}</h1>
        <Text label="Name" value={tool.name} onChange={(value) => patch((next) => { next.tools[index].name = value; })} />
        <Text label="Slug" value={tool.slug} hint="Used in the address. It is cleaned when you save." onChange={(value) => patch((next) => { next.tools[index].slug = value; })} />
        <label className="field">
          <span>Category</span>
          <select value={tool.category} onChange={(event) => patch((next) => { next.tools[index].category = event.target.value; })}>
            {draft.categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <Text label="One-line description" value={tool.blurb} onChange={(value) => patch((next) => { next.tools[index].blurb = value; })} />
        <Text label="Page story" area value={tool.description} onChange={(value) => patch((next) => { next.tools[index].description = value; })} />
        <Text label="Search title" value={tool.seoTitle} onChange={(value) => patch((next) => { next.tools[index].seoTitle = value; })} />
        <Text label="Search description" area={3} value={tool.seoDescription} onChange={(value) => patch((next) => { next.tools[index].seoDescription = value; })} />
        <div className="check-row">
          <Check label="Visible on the site" checked={tool.visible !== false} onChange={(value) => patch((next) => { next.tools[index].visible = value; })} />
          <Check label="Featured" checked={!!tool.featured} onChange={(value) => patch((next) => { next.tools[index].featured = value; })} />
        </div>
        <SettingsFields tool={tool} onChange={(settings) => patch((next) => { next.tools[index].settings = settings; })} />
        <p className="fine">Calculator type: {tool.kind}. The maths is part of the site. These fields change the words and the rates.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Tools</h1>
      <p className="fine">Hide a calculator instead of deleting it if you only want it off the public list.</p>
      <div className="plist-bar">
        <input value={query} placeholder="Search tools" onChange={(event) => setQuery(event.target.value)} />
        <select
          defaultValue=""
          onChange={(event) => {
            const kind = event.target.value;
            event.target.value = "";
            if (!kind) return;
            const base = defaultContent.tools.find((item) => item.kind === kind);
            if (!base) return;
            patch((next) => {
              const copy = structuredClone(base);
              const taken = new Set(next.tools.map((item) => item.slug));
              if (taken.has(copy.slug)) copy.slug = `${copy.slug}-2`;
              next.tools.push(copy);
            });
          }}
        >
          <option value="">Add a calculator</option>
          {defaultContent.tools.map((item) => (
            <option key={item.kind} value={item.kind}>{item.name}</option>
          ))}
        </select>
      </div>
      {picked.length > 0 && (
        <div className="bulk">
          <button type="button" onClick={() => patch((next) => next.tools.forEach((item) => picked.includes(item.slug) && (item.visible = true)))}>Show</button>
          <button type="button" onClick={() => patch((next) => next.tools.forEach((item) => picked.includes(item.slug) && (item.visible = false)))}>Hide</button>
          <button type="button" onClick={() => patch((next) => next.tools.forEach((item) => picked.includes(item.slug) && (item.featured = true)))}>Feature</button>
          <button type="button" onClick={() => patch((next) => next.tools.forEach((item) => picked.includes(item.slug) && (item.featured = false)))}>Unfeature</button>
        </div>
      )}
      <table className="grid-table">
        <thead>
          <tr>
            <th />
            <th>Name</th>
            <th>Desk</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ item, itemIndex }) => (
            <tr key={item.slug || itemIndex}>
              <td>
                <input
                  type="checkbox"
                  checked={picked.includes(item.slug)}
                  aria-label={`Select ${item.name}`}
                  onChange={(event) => setPicked((current) => event.target.checked ? [...current, item.slug] : current.filter((slug) => slug !== item.slug))}
                />
              </td>
              <td>
                <button type="button" className="text-link" onClick={() => setIndex(itemIndex)}>{item.name}</button>
                {item.visible === false && <span className="fine"> hidden</span>}
              </td>
              <td>{item.category}</td>
              <td className="row-actions">
                <IconBtn label="Move up" onClick={() => patch((next) => { next.tools = moveItem(next.tools, itemIndex, -1); })}>↑</IconBtn>
                <IconBtn label="Move down" onClick={() => patch((next) => { next.tools = moveItem(next.tools, itemIndex, 1); })}>↓</IconBtn>
                <IconBtn label={item.visible === false ? "Show" : "Hide"} onClick={() => patch((next) => { next.tools[itemIndex].visible = item.visible === false; })}>{item.visible === false ? "Show" : "Hide"}</IconBtn>
                <IconBtn label="Delete" onClick={() => window.confirm(`Delete ${item.name}?`) && patch((next) => { next.tools.splice(itemIndex, 1); })}>✕</IconBtn>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SettingsFields({ tool, onChange }) {
  const defaults = settingDefaults[tool.kind] || {};
  const settings = { ...defaults, ...(tool.settings || {}) };
  if (tool.kind === "zakat") {
    return (
      <>
        <h2>Sample prices</h2>
        <NumberField label="Gold price per tola" value={settings.goldPerTola} onChange={(value) => onChange({ ...settings, goldPerTola: value })} />
        <NumberField label="Silver price per tola" value={settings.silverPerTola} onChange={(value) => onChange({ ...settings, silverPerTola: value })} />
        <NumberField label="Gold nisab (tola)" value={settings.goldNisabTola} onChange={(value) => onChange({ ...settings, goldNisabTola: value })} />
        <NumberField label="Silver nisab (tola)" value={settings.silverNisabTola} onChange={(value) => onChange({ ...settings, silverNisabTola: value })} />
        <NumberField label="Rate percent" value={settings.rate} onChange={(value) => onChange({ ...settings, rate: value })} />
      </>
    );
  }
  if (tool.kind === "electricity") {
    const slabs = settings.slabs || [];
    return (
      <>
        <h2>Sample slabs</h2>
        <p className="fine">These are not a DISCO tariff until you replace them. Use 0 in the last “up to” row for every unit above the previous band.</p>
        {slabs.map((slab, index) => (
          <div className="pair" key={index}>
            <NumberField label="Up to units" value={slab.upto} onChange={(value) => onChange({ ...settings, slabs: slabs.map((item, itemIndex) => itemIndex === index ? { ...item, upto: value } : item) })} />
            <NumberField label="Rate per unit" value={slab.rate} onChange={(value) => onChange({ ...settings, slabs: slabs.map((item, itemIndex) => itemIndex === index ? { ...item, rate: value } : item) })} />
            <IconBtn label="Remove slab" onClick={() => onChange({ ...settings, slabs: slabs.filter((_, itemIndex) => itemIndex !== index) })}>✕</IconBtn>
          </div>
        ))}
        <button type="button" className="btn btn-line" onClick={() => onChange({ ...settings, slabs: [...slabs, { upto: 0, rate: 0 }] })}>Add slab</button>
        <NumberField label="Fixed charge" value={settings.fixed} onChange={(value) => onChange({ ...settings, fixed: value })} />
        <NumberField label="Tax percent" value={settings.taxPercent} onChange={(value) => onChange({ ...settings, taxPercent: value })} />
      </>
    );
  }
  if (tool.kind === "fuel") {
    return <NumberField label="Starting price per litre" value={settings.price} onChange={(value) => onChange({ ...settings, price: value })} />;
  }
  return <p className="fine">This calculator has no rates to publish. Visitors type every figure themselves.</p>;
}

function CategoriesPanel({ draft, patch }) {
  return (
    <div>
      <h1>Categories</h1>
      <button type="button" className="btn btn-line" onClick={() => patch((next) => { const synced = syncToolMenu(next); next.header = synced.header; })}>
        Update the Tools menu
      </button>
      {draft.categories.map((category, index) => (
        <div className="pair" key={category.id || index}>
          <Text label="Name" value={category.name} onChange={(value) => patch((next) => { next.categories[index].name = value; })} />
          <Text label="Short line" value={category.blurb} onChange={(value) => patch((next) => { next.categories[index].blurb = value; })} />
          <p className="fine">Id: {category.id}</p>
          <IconBtn label="Remove category" onClick={() => {
            if (draft.tools.some((tool) => tool.category === category.id)) {
              window.alert("Move the tools out of this category before removing it.");
              return;
            }
            patch((next) => { next.categories.splice(index, 1); });
          }}>✕</IconBtn>
        </div>
      ))}
      <button type="button" className="btn btn-line" onClick={() => patch((next) => next.categories.push({ id: uid("desk"), name: "New desk", blurb: "" }))}>
        Add category
      </button>
    </div>
  );
}

function GuidesPanel({ draft, patch }) {
  const [index, setIndex] = useState(-1);
  const guide = draft.guides[index];
  if (!guide) {
    return (
      <div>
        <h1>Guides</h1>
        <button type="button" className="btn btn-line" onClick={() => patch((next) => next.guides.push({ slug: uid("guide"), title: "New guide", excerpt: "", visible: true, sections: [{ heading: "First section", body: "" }] }))}>
          Add guide
        </button>
        <ul className="plain-list">
          {draft.guides.map((item, itemIndex) => (
            <li key={item.slug || itemIndex}>
              <button type="button" className="text-link" onClick={() => setIndex(itemIndex)}>{item.title || "Untitled"}</button>
              {item.visible === false && <span className="fine"> hidden</span>}
              <span className="row-actions">
                <IconBtn label="Move up" onClick={() => patch((next) => { next.guides = moveItem(next.guides, itemIndex, -1); })}>↑</IconBtn>
                <IconBtn label="Move down" onClick={() => patch((next) => { next.guides = moveItem(next.guides, itemIndex, 1); })}>↓</IconBtn>
                <IconBtn label="Delete" onClick={() => window.confirm("Delete this guide?") && patch((next) => { next.guides.splice(itemIndex, 1); })}>✕</IconBtn>
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div>
      <button type="button" className="text-link back" onClick={() => setIndex(-1)}>All guides</button>
      <h1>{guide.title || "Guide"}</h1>
      <Text label="Title" value={guide.title} onChange={(value) => patch((next) => { next.guides[index].title = value; })} />
      <Text label="Slug" value={guide.slug} onChange={(value) => patch((next) => { next.guides[index].slug = value; })} />
      <Text label="Excerpt" area={3} value={guide.excerpt} onChange={(value) => patch((next) => { next.guides[index].excerpt = value; })} />
      <Check label="Published" checked={guide.visible !== false} onChange={(value) => patch((next) => { next.guides[index].visible = value; })} />
      <h2>Sections</h2>
      {(guide.sections || []).map((section, sectionIndex) => (
        <div className="pair" key={sectionIndex}>
          <Text label="Heading" value={section.heading} onChange={(value) => patch((next) => { next.guides[index].sections[sectionIndex].heading = value; })} />
          <Text label="Body" area value={section.body} hint="A blank line starts a new paragraph." onChange={(value) => patch((next) => { next.guides[index].sections[sectionIndex].body = value; })} />
          <IconBtn label="Remove section" onClick={() => patch((next) => { next.guides[index].sections.splice(sectionIndex, 1); })}>✕</IconBtn>
        </div>
      ))}
      <button type="button" className="btn btn-line" onClick={() => patch((next) => next.guides[index].sections.push({ heading: "", body: "" }))}>Add section</button>
    </div>
  );
}

function BrandPanel({ draft, patch, onLogout }) {
  const brand = draft.brand;
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");

  async function upload(file) {
    if (!file) return;
    const dataUrl = await readFile(file);
    const response = await fetch("/api/admin/logo", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": sessionStorage.getItem(ADMIN_KEY) || "" },
      body: JSON.stringify({ dataUrl }),
    });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401) {
      onLogout(payload.error || "Your session expired. Sign in again.");
      return;
    }
    if (!response.ok) {
      setNote(payload.error || "The logo was not saved.");
      return;
    }
    patch((next) => { next.brand.logo = payload.url; });
    setNote("Logo uploaded. Save to keep it on the live site.");
  }

  async function changePassword(event) {
    event.preventDefault();
    const response = await fetch("/api/admin/password", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": sessionStorage.getItem(ADMIN_KEY) || "" },
      body: JSON.stringify({ password }),
    });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401) {
      onLogout(payload.error || "Your session expired. Sign in again.");
      return;
    }
    if (!response.ok) {
      setNote(payload.error || "Password was not changed.");
      return;
    }
    sessionStorage.setItem(ADMIN_KEY, password.trim());
    setPassword("");
    setNote("Password changed for this computer.");
  }

  return (
    <div>
      <h1>Brand</h1>
      <Text label="Shop name" value={brand.name} onChange={(value) => patch((next) => { next.brand.name = value; })} />
      <Text label="Tagline" value={brand.tagline} onChange={(value) => patch((next) => { next.brand.tagline = value; })} />
      <Text label="Email" value={brand.email} hint="Shown on About. The page does not send mail." onChange={(value) => patch((next) => { next.brand.email = value; })} />
      <Text label="Currency code" value={brand.currency} hint="PKR, USD, and other codes Intl understands." onChange={(value) => patch((next) => { next.brand.currency = value.toUpperCase(); })} />
      <Check label="Show the name beside the logo" checked={brand.showName !== false} onChange={(value) => patch((next) => { next.brand.showName = value; })} />
      <label className="field">
        <span>Header logo</span>
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={(event) => upload(event.target.files?.[0])} />
        <small>PNG, JPG, WEBP, GIF, or SVG under 2 MB. The file keeps its own colors in light and dark.</small>
      </label>
      {brand.logo && (
        <div className="logo-row">
          <img className="logo-image" src={brand.logo} alt="" />
          <IconBtn label="Remove logo" onClick={() => patch((next) => { next.brand.logo = ""; })}>✕</IconBtn>
        </div>
      )}
      <form onSubmit={changePassword}>
        <Text label="New admin password" type="password" value={password} onChange={setPassword} hint="At least 4 characters. This is separate from Save." />
        <button className="btn btn-line" type="submit">Change password</button>
      </form>
      {note && <p className="fine">{note}</p>}
    </div>
  );
}

function ThemesPanel({ draft, patch }) {
  return (
    <div>
      <h1>Themes</h1>
      <div className="theme-grid">
        {themes.map((theme) => (
          <button key={theme.id} type="button" className={draft.theme.preset === theme.id ? "theme-card on" : "theme-card"} onClick={() => patch((next) => applyTheme(next, theme))}>
            <strong>{theme.name}</strong>
            <span>{theme.note}</span>
          </button>
        ))}
      </div>
      <h2>Colors</h2>
      <div className="color-grid">
        {colors.map(([key, label]) => (
          <label key={key} className="field">
            <span>{label}</span>
            <input
              type="color"
              value={toColor(draft.theme[key])}
              onChange={(event) => patch((next) => {
                next.theme[key] = event.target.value;
                next.theme.preset = "custom";
              })}
            />
          </label>
        ))}
      </div>
      <label className="field">
        <span>Banner tone</span>
        <select value={draft.theme.stageMode} onChange={(event) => patch((next) => { next.theme.stageMode = event.target.value; next.theme.preset = "custom"; })}>
          <option value="dark">Dark banners</option>
          <option value="light">Light banners</option>
        </select>
      </label>
    </div>
  );
}

function FontsPanel({ draft, patch }) {
  const fonts = normalizeFonts(draft.fonts);
  return (
    <div>
      <h1>Fonts</h1>
      <p className="fine">These change the public site and the preview. Admin labels stay in Figtree.</p>
      {fontRoles.map((role) => (
        <div className="pair" key={role.id}>
          <label className="field">
            <span>{role.label}</span>
            <select
              value={fonts[role.id].family}
              onChange={(event) => patch((next) => {
                next.fonts = normalizeFonts(next.fonts);
                next.fonts[role.id].family = event.target.value;
              })}
            >
              {fontFamilies.map((family) => (
                <option key={family.id} value={family.id}>{family.label}</option>
              ))}
            </select>
            <small>{role.hint}</small>
          </label>
          <NumberField
            label="Size"
            value={fonts[role.id].size}
            onChange={(value) => patch((next) => {
              next.fonts = normalizeFonts(next.fonts);
              next.fonts[role.id].size = value;
            })}
          />
        </div>
      ))}
    </div>
  );
}

function AnnouncementPanel({ draft, patch }) {
  const bar = draft.announcement;
  return (
    <div>
      <h1>Announcement</h1>
      <Check label="Show the bar" checked={!!bar.show} onChange={(value) => patch((next) => { next.announcement.show = value; })} />
      <Text label="Text" value={bar.text} onChange={(value) => patch((next) => { next.announcement.text = value; })} />
      <Text label="Link label" value={bar.linkLabel} onChange={(value) => patch((next) => { next.announcement.linkLabel = value; })} />
      <Text label="Link address" value={bar.linkUrl} onChange={(value) => patch((next) => { next.announcement.linkUrl = value; })} />
    </div>
  );
}

function AdsPanel({ draft, patch }) {
  const clashes = clashPages(draft.ads);
  return (
    <div>
      <h1>Ads</h1>
      <p className="fine">Paste an embed, tick the pages, and choose where it sits. It scrolls with the page. The first switched-on ad for a page is the one that runs, so two embeds do not share one options object. Buyzaar does not click ads.</p>
      {clashes.length > 0 && <p className="aerror">More than one ad is on: {clashes.join(", ")}. Only the first is shown.</p>}
      {(draft.ads || []).map((ad, index) => (
        <div className="pair" key={ad.id}>
          <Text label="Name" value={ad.name} onChange={(value) => patch((next) => { next.ads[index].name = value; })} />
          <Check label="On" checked={!!ad.show} onChange={(value) => patch((next) => { next.ads[index].show = value; })} />
          <Text label="Embed" area={5} value={ad.script} onChange={(value) => patch((next) => { next.ads[index].script = value; })} />
          <fieldset className="checks">
            <legend>Pages</legend>
            {pageOptions.map(([id, label]) => (
              <Check
                key={id}
                label={label}
                checked={(ad.pages || []).includes(id)}
                onChange={(value) => patch((next) => {
                  const pages = new Set(next.ads[index].pages || []);
                  if (value) pages.add(id);
                  else pages.delete(id);
                  next.ads[index].pages = [...pages];
                })}
              />
            ))}
          </fieldset>
          <label className="field">
            <span>Place</span>
            <select value={ad.place || ""} onChange={(event) => patch((next) => { next.ads[index].place = event.target.value; })}>
              {adPlaces.map(([id, label]) => (
                <option key={id || "none"} value={id}>{label}</option>
              ))}
            </select>
            <small>An ad with no place sits just above the footer. In the preview it also appears at the top so you can see it.</small>
          </label>
          <label className="field">
            <span>Edge</span>
            <select value={ad.edge || "after"} onChange={(event) => patch((next) => { next.ads[index].edge = event.target.value; })}>
              <option value="before">Above the section</option>
              <option value="after">Below the section</option>
            </select>
          </label>
          <NumberField label="Width percent" value={ad.w} onChange={(value) => patch((next) => { next.ads[index].w = value; })} />
          <NumberField label="Height in pixels" value={ad.h} onChange={(value) => patch((next) => { next.ads[index].h = value; })} />
          <IconBtn label="Remove ad" onClick={() => patch((next) => { next.ads.splice(index, 1); })}>✕</IconBtn>
        </div>
      ))}
      <button type="button" className="btn btn-line" onClick={() => patch((next) => next.ads.push({ id: uid("ad"), name: "New ad", script: "", show: false, pages: ["home"], place: "", edge: "after", w: 100, h: 220 }))}>
        Add ad
      </button>
    </div>
  );
}

function NavPanel({ draft, patch }) {
  const header = draft.header;
  return (
    <div>
      <h1>Navigation</h1>
      <label className="field">
        <span>Arrangement</span>
        <select value={header.design} onChange={(event) => patch((next) => { next.header.design = event.target.value; })}>
          {headerDesigns.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <label className="field">
        <span>Bar</span>
        <select value={header.bar} onChange={(event) => patch((next) => { next.header.bar = event.target.value; })}>
          <option value="glass">Frosted glass</option>
          <option value="solid">Solid</option>
          <option value="ink">Dark</option>
          <option value="line">Transparent with a line</option>
        </select>
      </label>
      <label className="field">
        <span>Links</span>
        <select value={header.links} onChange={(event) => patch((next) => { next.header.links = event.target.value; })}>
          <option value="underline">Underline</option>
          <option value="pills">Pills</option>
          <option value="plain">Plain</option>
        </select>
      </label>
      <Check label="Show search" checked={header.showSearch !== false} onChange={(value) => patch((next) => { next.header.showSearch = value; })} />
      <Text label="Search placeholder" value={header.searchPlaceholder} onChange={(value) => patch((next) => { next.header.searchPlaceholder = value; })} />
      <h2>Menu</h2>
      {header.items.map((item, index) => (
        <div className="pair" key={item.id}>
          <Text label="Label" value={item.label} onChange={(value) => patch((next) => { next.header.items[index].label = value; })} />
          <Text label="Address" value={item.to} onChange={(value) => patch((next) => { next.header.items[index].to = value; })} />
          <Check label="Show" checked={item.show !== false} onChange={(value) => patch((next) => { next.header.items[index].show = value; })} />
          <label className="field">
            <span>Type</span>
            <select value={item.type || "link"} onChange={(event) => patch((next) => { next.header.items[index].type = event.target.value; })}>
              <option value="link">Link</option>
              <option value="dropdown">Dropdown</option>
            </select>
          </label>
          {item.type === "dropdown" && (
            <div>
              {(item.children || []).map((child, childIndex) => (
                <div className="pair" key={child.id}>
                  <Text label="Child label" value={child.label} onChange={(value) => patch((next) => { next.header.items[index].children[childIndex].label = value; })} />
                  <Text label="Child address" value={child.to} onChange={(value) => patch((next) => { next.header.items[index].children[childIndex].to = value; })} />
                </div>
              ))}
              <button type="button" className="btn btn-line" onClick={() => patch((next) => next.header.items[index].children.push({ id: uid("nav"), label: "New link", to: "/tools", show: true }))}>
                Add child link
              </button>
            </div>
          )}
          <div className="row-actions">
            <IconBtn label="Move up" onClick={() => patch((next) => { next.header.items = moveItem(next.header.items, index, -1); })}>↑</IconBtn>
            <IconBtn label="Move down" onClick={() => patch((next) => { next.header.items = moveItem(next.header.items, index, 1); })}>↓</IconBtn>
            <IconBtn label="Remove" onClick={() => patch((next) => { next.header.items.splice(index, 1); })}>✕</IconBtn>
          </div>
        </div>
      ))}
      <button type="button" className="btn btn-line" onClick={() => patch((next) => next.header.items.push({ id: uid("nav"), label: "New link", type: "link", to: "/", show: true, children: [] }))}>
        Add menu item
      </button>
    </div>
  );
}

function FooterPanel({ draft, patch }) {
  const footer = draft.footer;
  return (
    <div>
      <h1>Footer</h1>
      <Check label="Show footer" checked={footer.show !== false} onChange={(value) => patch((next) => { next.footer.show = value; })} />
      <label className="field">
        <span>Design</span>
        <select value={footer.design} onChange={(event) => patch((next) => { next.footer.design = event.target.value; })}>
          {footerDesigns.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <label className="field">
        <span>Tone</span>
        <select value={footer.tone} onChange={(event) => patch((next) => { next.footer.tone = event.target.value; })}>
          <option value="ink">Dark</option>
          <option value="paper">Light</option>
          <option value="contrast">Button color</option>
        </select>
      </label>
      <Text label="Intro" area value={footer.lead} onChange={(value) => patch((next) => { next.footer.lead = value; })} />
      <Text label="Copyright line" value={footer.copyright} onChange={(value) => patch((next) => { next.footer.copyright = value; })} />
      <Text label="Footer logo address" value={footer.logo} hint="Leave empty to reuse the header logo." onChange={(value) => patch((next) => { next.footer.logo = value; })} />
      <h2>Newsletter</h2>
      <Check label="Show the placeholder signup" checked={!!footer.newsletter?.show} onChange={(value) => patch((next) => { next.footer.newsletter.show = value; })} />
      <Text label="Title" value={footer.newsletter?.title} onChange={(value) => patch((next) => { next.footer.newsletter.title = value; })} />
      <Text label="Note" value={footer.newsletter?.note} hint="Say that it does not send email." onChange={(value) => patch((next) => { next.footer.newsletter.note = value; })} />
      <Text label="Thanks line" value={footer.newsletter?.thanks} onChange={(value) => patch((next) => { next.footer.newsletter.thanks = value; })} />
      <h2>Link columns</h2>
      {(footer.columns || []).map((column, index) => (
        <div className="pair" key={column.id || index}>
          <Text label="Column title" value={column.title} onChange={(value) => patch((next) => { next.footer.columns[index].title = value; })} />
          {(column.links || []).map((link, linkIndex) => (
            <div className="pair" key={link.id || linkIndex}>
              <Text label="Link label" value={link.label} onChange={(value) => patch((next) => { next.footer.columns[index].links[linkIndex].label = value; })} />
              <Text label="Address" value={link.to} onChange={(value) => patch((next) => { next.footer.columns[index].links[linkIndex].to = value; })} />
            </div>
          ))}
          <button type="button" className="btn btn-line" onClick={() => patch((next) => next.footer.columns[index].links.push({ id: uid("link"), label: "New link", to: "/" }))}>Add link</button>
        </div>
      ))}
    </div>
  );
}

function HomePanel({ draft, patch }) {
  const home = draft.home;
  return (
    <div>
      <h1>Home</h1>
      <Check label="Show hero" checked={home.hero.show !== false} onChange={(value) => patch((next) => { next.home.hero.show = value; })} />
      <Text label="Eyebrow" value={home.hero.eyebrow} onChange={(value) => patch((next) => { next.home.hero.eyebrow = value; })} />
      <Text label="Title" area={3} hint="A line break in this box becomes a second line." value={home.hero.title} onChange={(value) => patch((next) => { next.home.hero.title = value; })} />
      <Text label="Intro" area value={home.hero.lede} onChange={(value) => patch((next) => { next.home.hero.lede = value; })} />
      <Text label="Primary button" value={home.hero.primaryLabel} onChange={(value) => patch((next) => { next.home.hero.primaryLabel = value; })} />
      <Text label="Primary address" value={home.hero.primaryTo} onChange={(value) => patch((next) => { next.home.hero.primaryTo = value; })} />
      <Text label="Secondary button" value={home.hero.secondaryLabel} onChange={(value) => patch((next) => { next.home.hero.secondaryLabel = value; })} />
      <Text label="Secondary address" value={home.hero.secondaryTo} onChange={(value) => patch((next) => { next.home.hero.secondaryTo = value; })} />
      <Check label="Show the number row" checked={home.hero.showStats !== false} onChange={(value) => patch((next) => { next.home.hero.showStats = value; })} />
      <Check label="Show featured tools beside the hero" checked={home.hero.showStage !== false} onChange={(value) => patch((next) => { next.home.hero.showStage = value; })} />
      <h2>Stats</h2>
      {home.hero.stats.map((stat, index) => (
        <div className="pair" key={index}>
          <Text label="Value" value={stat.value} hint="Tokens: {name} {tagline} {currency} {tools} {guides} {categories}" onChange={(value) => patch((next) => { next.home.hero.stats[index].value = value; })} />
          <Text label="Label" value={stat.label} onChange={(value) => patch((next) => { next.home.hero.stats[index].label = value; })} />
        </div>
      ))}
      <Check label="Show the scrolling line" checked={home.marquee.show !== false} onChange={(value) => patch((next) => { next.home.marquee.show = value; })} />
      <Text label="Marquee phrases" area hint="One phrase per line." value={home.marquee.phrases.join("\n")} onChange={(value) => patch((next) => { next.home.marquee.phrases = value.split("\n"); })} />
      <h2>Categories</h2>
      <Check label="Show" checked={home.categories.show !== false} onChange={(value) => patch((next) => { next.home.categories.show = value; })} />
      <Text label="Eyebrow" value={home.categories.kicker} onChange={(value) => patch((next) => { next.home.categories.kicker = value; })} />
      <Text label="Title" value={home.categories.title} onChange={(value) => patch((next) => { next.home.categories.title = value; })} />
      <h2>Featured</h2>
      <Check label="Show" checked={home.featured.show !== false} onChange={(value) => patch((next) => { next.home.featured.show = value; })} />
      <Text label="Eyebrow" value={home.featured.kicker} onChange={(value) => patch((next) => { next.home.featured.kicker = value; })} />
      <Text label="Title" value={home.featured.title} onChange={(value) => patch((next) => { next.home.featured.title = value; })} />
      <p className="fine">Feature tools from the Tools table. If none are featured, the first four visible tools are used.</p>
      <h2>Steps</h2>
      <Check label="Show" checked={home.steps.show !== false} onChange={(value) => patch((next) => { next.home.steps.show = value; })} />
      <Text label="Title" value={home.steps.title} onChange={(value) => patch((next) => { next.home.steps.title = value; })} />
      {home.steps.items.map((step, index) => (
        <div className="pair" key={index}>
          <Text label="Step title" value={step.title} onChange={(value) => patch((next) => { next.home.steps.items[index].title = value; })} />
          <Text label="Step text" area={3} value={step.text} onChange={(value) => patch((next) => { next.home.steps.items[index].text = value; })} />
        </div>
      ))}
      <h2>Closing band</h2>
      <Check label="Show" checked={home.close.show !== false} onChange={(value) => patch((next) => { next.home.close.show = value; })} />
      <Text label="Eyebrow" value={home.close.eyebrow} onChange={(value) => patch((next) => { next.home.close.eyebrow = value; })} />
      <Text label="Title" value={home.close.title} onChange={(value) => patch((next) => { next.home.close.title = value; })} />
      <Text label="Button" value={home.close.label} onChange={(value) => patch((next) => { next.home.close.label = value; })} />
      <Text label="Address" value={home.close.url} onChange={(value) => patch((next) => { next.home.close.url = value; })} />
    </div>
  );
}

function DirectoryPanel({ draft, patch }) {
  const page = draft.directory;
  return (
    <div>
      <h1>Tools page</h1>
      <Text label="Eyebrow" value={page.kicker} onChange={(value) => patch((next) => { next.directory.kicker = value; })} />
      <Text label="Title" value={page.title} onChange={(value) => patch((next) => { next.directory.title = value; })} />
      <Text label="Intro" area value={page.intro} onChange={(value) => patch((next) => { next.directory.intro = value; })} />
      <Text label="Empty title" value={page.emptyTitle} onChange={(value) => patch((next) => { next.directory.emptyTitle = value; })} />
      <Text label="Empty sentence" value={page.emptyText} onChange={(value) => patch((next) => { next.directory.emptyText = value; })} />
      <Text label="Empty button" value={page.emptyButton} onChange={(value) => patch((next) => { next.directory.emptyButton = value; })} />
      <Check label="Show filters" checked={page.showFilters !== false} onChange={(value) => patch((next) => { next.directory.showFilters = value; })} />
    </div>
  );
}

function AboutPanel({ draft, patch }) {
  const about = draft.about;
  return (
    <div>
      <h1>About</h1>
      <Text label="Eyebrow" value={about.kicker} onChange={(value) => patch((next) => { next.about.kicker = value; })} />
      <Text label="Title" value={about.title} onChange={(value) => patch((next) => { next.about.title = value; })} />
      <Text label="Intro" area value={about.lede} onChange={(value) => patch((next) => { next.about.lede = value; })} />
      <h2>Sections</h2>
      {about.sections.map((section, index) => (
        <div className="pair" key={index}>
          <Text label="Heading" value={section.heading} onChange={(value) => patch((next) => { next.about.sections[index].heading = value; })} />
          <Text label="Body" area value={section.body} onChange={(value) => patch((next) => { next.about.sections[index].body = value; })} />
        </div>
      ))}
      <h2>Questions</h2>
      {about.faq.map((item, index) => (
        <div className="pair" key={index}>
          <Text label="Question" value={item.q} onChange={(value) => patch((next) => { next.about.faq[index].q = value; })} />
          <Text label="Answer" area={3} value={item.a} onChange={(value) => patch((next) => { next.about.faq[index].a = value; })} />
        </div>
      ))}
      <Text label="Contact title" value={about.contactTitle} onChange={(value) => patch((next) => { next.about.contactTitle = value; })} />
      <Text label="Contact note" area={3} value={about.contactText} onChange={(value) => patch((next) => { next.about.contactText = value; })} />
    </div>
  );
}

function SeoPanel({ draft, patch }) {
  const seo = draft.seo;
  return (
    <div>
      <h1>SEO</h1>
      <Text label="Title" value={seo.title} hint="{name} and {tagline} fill in on the home page. Tool and guide pages use their own titles." onChange={(value) => patch((next) => { next.seo.title = value; })} />
      <Text label="Description" area value={seo.description} onChange={(value) => patch((next) => { next.seo.description = value; })} />
      <Text label="Keywords" value={seo.keywords} onChange={(value) => patch((next) => { next.seo.keywords = value; })} />
      <Text label="Site URL" value={seo.siteUrl} hint="Used for the canonical link. Leave empty to use the address in the browser." onChange={(value) => patch((next) => { next.seo.siteUrl = value; })} />
      <label className="field">
        <span>Search engines</span>
        <select value={seo.robots} onChange={(event) => patch((next) => { next.seo.robots = event.target.value; })}>
          <option value="index,follow">Index this site</option>
          <option value="noindex,nofollow">Hide this site</option>
        </select>
      </label>
    </div>
  );
}

function LayoutPanel({ draft, patch }) {
  const layout = draft.layout;
  return (
    <div>
      <h1>Layout</h1>
      <SelectField label="Content width" value={layout.contentWidth} onChange={(value) => patch((next) => { next.layout.contentWidth = value; })} options={[["narrow", "Narrow"], ["standard", "Standard"], ["wide", "Wide"], ["full", "Edge to edge"]]} />
      <SelectField label="Body alignment" value={layout.bodyAlign} onChange={(value) => patch((next) => { next.layout.bodyAlign = value; })} options={[["left", "Left"], ["center", "Center"], ["right", "Right"]]} />
      <NumberField label="Space between sections" value={layout.sectionGap} onChange={(value) => patch((next) => { next.layout.sectionGap = value; })} hint="36 matches the current rhythm. 0 is tight. Around 80 is airy." />
      <NumberField label="Home hero height" value={layout.heroHeight} onChange={(value) => patch((next) => { next.layout.heroHeight = value; })} hint="Pixels. 0 means automatic. Other banners keep their own padding." />
      <SelectField label="Banner width" value={layout.bannerWidth} onChange={(value) => patch((next) => { next.layout.bannerWidth = value; })} options={[["contained", "Contained"], ["full", "Edge to edge"]]} />
      <SelectField label="Banner alignment" value={layout.bannerAlign} onChange={(value) => patch((next) => { next.layout.bannerAlign = value; })} options={[["left", "Left"], ["center", "Center"], ["right", "Right"]]} hint="Center puts the words in the middle of the whole hero." />
      <SelectField label="Header width" value={layout.headerWidth} onChange={(value) => patch((next) => { next.layout.headerWidth = value; })} options={[["full", "Edge to edge"], ["contained", "In the column"]]} />
      <SelectField label="Announcement alignment" value={layout.promoAlign} onChange={(value) => patch((next) => { next.layout.promoAlign = value; })} options={[["left", "Left"], ["center", "Center"], ["right", "Right"]]} />
      <SelectField label="Footer width" value={layout.footerWidth} onChange={(value) => patch((next) => { next.layout.footerWidth = value; })} options={[["full", "Edge to edge"], ["contained", "In the column"]]} />
    </div>
  );
}

function Text({ label, value, onChange, hint, area, type = "text", name }) {
  return (
    <label className="field">
      <span>{label}</span>
      {area ? (
        <textarea rows={area === true ? 5 : area} value={value || ""} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input name={name} type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} />
      )}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function NumberField({ label, value, onChange, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="number" value={value ?? 0} onChange={(event) => onChange(event.target.value === "" ? 0 : Number(event.target.value))} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

function SelectField({ label, value, onChange, options, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([id, name]) => (
          <option key={id} value={id}>{name}</option>
        ))}
      </select>
      {hint && <small>{hint}</small>}
    </label>
  );
}

function Check({ label, checked, onChange }) {
  return (
    <label className="check">
      <input type="checkbox" checked={!!checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function IconBtn({ label, onClick, children }) {
  return (
    <button type="button" className="icon-btn" title={label} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

function clashPages(ads) {
  const counts = {};
  (ads || []).filter((ad) => ad.show).forEach((ad) => {
    (ad.pages || []).forEach((page) => {
      counts[page] = (counts[page] || 0) + 1;
    });
  });
  return Object.entries(counts).filter(([, count]) => count > 1).map(([page]) => page);
}

function toColor(value) {
  const raw = String(value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw : "#000000";
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
