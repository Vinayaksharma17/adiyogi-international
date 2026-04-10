import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const id = hash.slice(1);
    if (id) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}