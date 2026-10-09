import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function stripSlash(url: string): string {
  return String(url || "").replace(/\/+$/, "");
}

function listenToBrowserOrigin(listenUrl: string): string {
  const value = stripSlash(listenUrl);
  if (!value) return "http://localhost:5050";
  try {
    const parsed = new URL(value);
    if (parsed.hostname === "0.0.0.0" || parsed.hostname === "::" || parsed.hostname === "[::]") {
      parsed.hostname = "localhost";
    }
    parsed.pathname = "";
    parsed.search = "";
    parsed.hash = "";
    return stripSlash(parsed.toString());
  } catch {
    return value
      .replace(/:\/\/0\.0\.0\.0/gi, "://localhost")
      .replace(/:\/\/\[::\]/gi, "://localhost");
  }
}

function readAppointzaUrls(filePath: string): { backendListen: string; frontendApiBaseUrl: string } | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return {
      backendListen: String(parsed.backendListen || "").trim().replace(/\/+$/, ""),
      frontendApiBaseUrl: String(parsed.frontendApiBaseUrl || "").trim().replace(/\/+$/, ""),
    };
  } catch {
    return null;
  }
}

function localDevPort(fallback = 8083): number {
  const fromEnv = Number(process.env.PORT || process.env.VITE_PORT || "");
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : fallback;
}

export default defineConfig(({ mode }) => {
  const buildRoot = stripSlash(
    process.env.APPOINTZA_BUILD_OUT || "D:/aravindan/build/appointza",
  ).replace(/\\/g, "/");
  const wwwrootOutDir = path.resolve(`${buildRoot}/wwwroot`);
  // Single URL/port file in the build: next to appointza.exe (the server serves it to the browser).
  const urlsBuildPath = path.resolve(buildRoot, "appointza-urls.json");
  const urlsPublicPath = path.resolve(__dirname, "public/appointza-urls.json");

  const urls =
    readAppointzaUrls(urlsBuildPath) ||
    readAppointzaUrls(urlsPublicPath) ||
    { backendListen: "http://0.0.0.0:5050", frontendApiBaseUrl: "" };

  const proxyTarget = listenToBrowserOrigin(urls.backendListen || "http://0.0.0.0:5050");
  const devPort = localDevPort(8083);

  return {
    server: {
      host: "0.0.0.0",
      port: devPort,
      strictPort: true,
      allowedHosts: true,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (p) => p,
        },
        "/health": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
      middlewareMode: false,
    },
    preview: {
      host: "0.0.0.0",
      port: devPort,
      strictPort: true,
    },
    build: {
      outDir: wwwrootOutDir,
      emptyOutDir: true,
    },
    esbuild:
      mode === "production"
        ? { pure: ["console.log", "console.info", "console.debug"], drop: ["debugger"] }
        : undefined,
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      {
        name: "appointza-urls-single-file",
        closeBundle() {
          // Vite copies public/ into wwwroot; drop that copy so only the file next to the exe exists.
          fs.rmSync(path.join(wwwrootOutDir, "appointza-urls.json"), { force: true });
          // Keep an operator-edited build file; seed it from public/ only on the first build.
          if (!fs.existsSync(urlsBuildPath) && fs.existsSync(urlsPublicPath)) {
            fs.mkdirSync(path.dirname(urlsBuildPath), { recursive: true });
            fs.copyFileSync(urlsPublicPath, urlsBuildPath);
          }
          console.log("");
          console.log(`[appointza] URL/port config: ${urlsBuildPath}`);
          console.log("");
        },
      },
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
