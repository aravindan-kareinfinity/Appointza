#!/usr/bin/env node

/**
 * Updates appointza-urls.json (Krios-style). Does NOT touch config.js URLs.
 *
 * Usage:
 *   npm run set:url -- <backendListenOrApiOrigin> <frontendApiBaseUrl>
 *   npm run set:url -- http://0.0.0.0:5050 ""
 *   npm run set:url -- http://0.0.0.0:5050 https://appointza.com
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uiRoot = path.resolve(__dirname, "..");
const urlsPath = path.join(uiRoot, "public", "appointza-urls.json");

const listenArg = process.argv[2];
const apiArg = process.argv[3];

if (listenArg === undefined || apiArg === undefined) {
  console.error("Set URLs in appointza-urls.json:");
  console.error("  1) backendListen       - e.g. http://0.0.0.0:5050");
  console.error("  2) frontendApiBaseUrl  - e.g. https://appointza.com  (or \"\" for same-origin)");
  console.error("");
  console.error("Usage:");
  console.error('  npm run set:url -- http://0.0.0.0:5050 ""');
  console.error("  npm run set:url -- http://0.0.0.0:5050 https://appointza.com");
  process.exit(1);
}

const backendListen = String(listenArg || "").trim().replace(/\/+$/, "") || "http://0.0.0.0:5050";
const frontendApiBaseUrl = String(apiArg || "").trim().replace(/\/+$/, "");

if (!/^https?:\/\//i.test(backendListen)) {
  console.error(`Invalid backendListen "${listenArg}". Use a full URL with http/https.`);
  process.exit(1);
}
if (frontendApiBaseUrl && !/^https?:\/\//i.test(frontendApiBaseUrl)) {
  console.error(`Invalid frontendApiBaseUrl "${apiArg}". Use a full URL or empty string.`);
  process.exit(1);
}

const payload = {
  backendListen,
  frontendApiBaseUrl,
};

fs.writeFileSync(urlsPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

console.log(`Updated ${path.relative(path.resolve(uiRoot, ".."), urlsPath)}`);
console.log(`  backendListen:      ${backendListen}`);
console.log(`  frontendApiBaseUrl: ${frontendApiBaseUrl || "(same origin)"}`);
console.log("");
console.log("config.js is unchanged (public map/push keys only).");
