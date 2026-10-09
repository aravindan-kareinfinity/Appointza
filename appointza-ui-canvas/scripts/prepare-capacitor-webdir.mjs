#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uiRoot = path.resolve(__dirname, "..");
const sourceDir = process.env.APPOINTZA_BUILD_OUT
  ? path.resolve(process.env.APPOINTZA_BUILD_OUT, "wwwroot")
  : path.resolve("D:/aravindan/build/appointza/wwwroot");
const targetDir = path.resolve(uiRoot, "dist");

if (!fs.existsSync(sourceDir)) {
  console.error(`Source build folder not found: ${sourceDir}`);
  console.error("Run .\\build-appointza.ps1 or npm run build first.");
  process.exit(1);
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });
for (const entry of fs.readdirSync(sourceDir)) {
  const from = path.join(sourceDir, entry);
  const to = path.join(targetDir, entry);
  fs.cpSync(from, to, { recursive: true });
}

console.log(`Copied web assets:`);
console.log(`- from: ${sourceDir}`);
console.log(`- to  : ${targetDir}`);
