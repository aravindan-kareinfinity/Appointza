import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found");
}

/** Load appointza-urls.json before the app boots (Krios-style). */
async function loadApiUrl() {
  try {
    const res = await fetch("/appointza-urls.json", { cache: "no-store" });
    if (!res.ok) return;
    const urls = (await res.json()) as {
      frontendApiBaseUrl?: string;
    };
    window.__APPOINTZA_API_URL__ = String(urls.frontendApiBaseUrl ?? "").trim();
  } catch {
    /* same-origin /api */
  }
}

void (async () => {
  await loadApiUrl();
  const { default: App } = await import("./App.tsx");
  createRoot(rootEl).render(
    <HelmetProvider>
      <App />
    </HelmetProvider>,
  );
})();
