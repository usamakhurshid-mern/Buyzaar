import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AdInbox } from "./Region";
import Footer from "./Footer";
import Header from "./Header";

export default function Layout() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target) {
        target.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [location.pathname, location.search, location.hash]);

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <AdInbox place="edit" />
        <Outlet />
      </main>
      <AdInbox place="live" />
      <Footer />
    </>
  );
}
