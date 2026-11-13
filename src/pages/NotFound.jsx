import { useCatalog } from "../catalog/context";
import SmartLink from "../components/SmartLink";
import { useSeo } from "../useSeo";

export default function NotFound() {
  const { content } = useCatalog();
  useSeo(content, {
    title: `Page not found — ${content.brand.name}`,
    description: "That page is not on Buyzaar.",
    robots: "noindex,follow",
  });
  return (
    <div className="page">
      <header className="page-banner">
        <p className="eyebrow">404</p>
        <h1>This page is not on the desk.</h1>
        <p className="lede">The link may be old. The tools are still on the list.</p>
        <SmartLink className="btn btn-light" to="/tools">
          Browse tools
        </SmartLink>
      </header>
    </div>
  );
}
