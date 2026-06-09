import fs from "node:fs";
import vm from "node:vm";

const SITE_URL = "https://ielts.wisely.top";
const TODAY = new Date().toISOString().slice(0, 10);

const source = fs.readFileSync("data/lesson-index.js", "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const lessons = Array.isArray(sandbox.window.videoLessons) ? sandbox.window.videoLessons : [];

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const urlEntry = ({ loc, changefreq, priority }) => `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

const urls = [
  urlEntry({ loc: `${SITE_URL}/`, changefreq: "daily", priority: "1.0" }),
  ...lessons.map((lesson) =>
    urlEntry({
      loc: `${SITE_URL}/lessons/${lesson.path}`,
      changefreq: "weekly",
      priority: "0.8",
    }),
  ),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

fs.writeFileSync("sitemap.xml", sitemap);
console.log(`Generated sitemap.xml with ${urls.length} URLs.`);
