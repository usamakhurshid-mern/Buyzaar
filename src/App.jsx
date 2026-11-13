import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import Admin from "./admin/Admin";
import { ApplyChrome, CatalogProvider } from "./catalog/CatalogContext";
import { useCatalog } from "./catalog/context";
import Layout from "./components/Layout";
import SiteSkeleton from "./components/SiteSkeleton";
import About from "./pages/About";
import Compare from "./pages/Compare";
import GuidePage from "./pages/GuidePage";
import Guides from "./pages/Guides";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ProductPage from "./pages/ProductPage";
import SearchPage from "./pages/SearchPage";
import Shop from "./pages/Shop";
import ToolPage from "./pages/ToolPage";
import Tools from "./pages/Tools";

export default function App() {
  return (
    <CatalogProvider>
      <BrowserRouter>
        <ApplyChrome />
        <PreviewBridge />
        <PreviewGate />
      </BrowserRouter>
    </CatalogProvider>
  );
}

function PreviewGate() {
  const { content } = useCatalog();
  if (!content) return <SiteSkeleton />;
  return (
    <Routes>
      <Route path="admin" element={<Admin />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="shop/:slug" element={<ProductPage />} />
        <Route path="compare" element={<Compare />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="tools" element={<Tools />} />
        <Route path="tools/:slug" element={<ToolPage />} />
        <Route path="guides" element={<Guides />} />
        <Route path="guides/:slug" element={<GuidePage />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function PreviewBridge() {
  const { setPreviewContent } = useCatalog();
  const navigate = useNavigate();

  useEffect(() => {
    if (window.parent === window) return undefined;
    function onMessage(event) {
      if (event.origin !== window.location.origin || !event.data) return;
      if (event.data.type === "buyzaar-preview") setPreviewContent(event.data.content);
      if (event.data.type === "buyzaar-preview-go" && typeof event.data.path === "string") navigate(event.data.path);
    }
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "buyzaar-preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, [navigate, setPreviewContent]);

  return null;
}
