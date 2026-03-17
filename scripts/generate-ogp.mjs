import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";

const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;
const SITE_NAME = "徒然";
const SITE_SUBTITLE = "北野武映画レビュー";
const OUTPUT_ROOT = path.join(process.cwd(), "public", "og");
const OUTPUT_FILMS = path.join(OUTPUT_ROOT, "films");

async function loadDotenv(filePath) {
  try {
    const source = await readFile(filePath, "utf8");
    const entries = source
      .split(/\r?\n/)
      .filter((line) => line && !line.trim().startsWith("#"))
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        if (separatorIndex === -1) {
          return null;
        }

        const key = line.slice(0, separatorIndex).trim();
        const rawValue = line.slice(separatorIndex + 1).trim();
        const value = rawValue.replace(/^['"]|['"]$/g, "");
        return [key, value];
      })
      .filter(Boolean);

    return Object.fromEntries(entries);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

const env = {
  ...(await loadDotenv(path.join(process.cwd(), ".env"))),
  ...(await loadDotenv(path.join(process.cwd(), ".env.production"))),
  ...process.env,
};

const domain = env.MICROCMS_SERVICE_DOMAIN;
const apiKey = env.MICROCMS_API_KEY;

if (!domain || !apiKey) {
  throw new Error(
    "Missing microCMS env vars. Set MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY.",
  );
}

async function microCMSGet(endpoint, query = {}) {
  const url = new URL(`https://${domain}.microcms.io/api/v1/${endpoint}`);
  Object.entries(query).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  );

  const response = await fetch(url, {
    headers: {
      "X-MICROCMS-API-KEY": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(
      `microCMS fetch failed: ${response.status} ${await response.text()}`,
    );
  }

  return response.json();
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function charWidth(char) {
  return /[ -~]/.test(char) ? 0.58 : 1;
}

function wrapText(text, maxWidth, maxLines) {
  const chars = [...String(text).trim()];
  const lines = [];
  let current = "";
  let currentWidth = 0;

  for (const char of chars) {
    const width = charWidth(char);
    if (current && currentWidth + width > maxWidth) {
      lines.push(current);
      current = char;
      currentWidth = width;
      if (lines.length === maxLines) {
        break;
      }
      continue;
    }

    current += char;
    currentWidth += width;
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  if (lines.length > maxLines) {
    lines.length = maxLines;
  }

  const consumed = lines.join("").length;
  if (consumed < chars.length && lines.length) {
    const lastLine = lines[lines.length - 1];
    lines[lines.length - 1] = `${lastLine.slice(0, Math.max(0, lastLine.length - 1))}…`;
  }

  return lines;
}

function createBaseSvg(content) {
  return `
    <svg width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}" viewBox="0 0 ${IMAGE_WIDTH} ${IMAGE_HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
          <stop stop-color="#050816" />
          <stop offset="1" stop-color="#111c2f" />
        </linearGradient>
        <linearGradient id="line" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#d6b36f" />
          <stop offset="1" stop-color="#8f7440" />
        </linearGradient>
      </defs>
      <rect width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}" fill="url(#bg)" />
      <rect x="72" y="72" width="1056" height="486" rx="28" fill="rgba(255,255,255,0.03)" stroke="rgba(214,179,111,0.20)" />
      <rect x="104" y="104" width="12" height="422" rx="6" fill="url(#line)" />
      <circle cx="1056" cy="122" r="84" fill="rgba(214,179,111,0.08)" />
      <circle cx="1102" cy="170" r="34" fill="rgba(214,179,111,0.12)" />
      ${content}
    </svg>
  `;
}

function renderPng(svg) {
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: IMAGE_WIDTH,
    },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: "sans-serif",
    },
  });

  return resvg.render().asPng();
}

function createSiteSvg() {
  return createBaseSvg(`
    <text x="148" y="182" fill="#d6b36f" font-size="30" font-family="sans-serif" letter-spacing="0.22em">${escapeXml(SITE_NAME)}</text>
    <text x="148" y="314" fill="#f7f4ed" font-size="86" font-weight="700" font-family="sans-serif">${escapeXml(SITE_SUBTITLE)}</text>
    <text x="148" y="384" fill="rgba(247,244,237,0.72)" font-size="34" font-family="sans-serif">レビューを公開している作品だけを、静かに辿れるサイト</text>
    <text x="148" y="500" fill="rgba(247,244,237,0.58)" font-size="28" font-family="sans-serif">Kitano Takeshi films / published reviews only</text>
  `);
}

function createFilmSvg(review) {
  const releaseYear = String(review.film.releaseDate ?? "").match(/\d{4}/)?.[0] ?? "----";
  const titleLines = wrapText(review.film.title, 11.8, 3);
  const titleSvg = titleLines
    .map(
      (line, index) => `
        <text
          x="148"
          y="${250 + index * 104}"
          fill="#f7f4ed"
          font-size="78"
          font-weight="700"
          font-family="sans-serif"
        >${escapeXml(line)}</text>`,
    )
    .join("");

  return createBaseSvg(`
    <text x="148" y="164" fill="#d6b36f" font-size="28" font-family="sans-serif" letter-spacing="0.18em">${escapeXml(SITE_NAME)} / ${escapeXml(SITE_SUBTITLE)}</text>
    ${titleSvg}
    <text x="148" y="520" fill="rgba(247,244,237,0.68)" font-size="32" font-family="sans-serif">公開年 ${escapeXml(releaseYear)} / Review</text>
  `);
}

async function main() {
  const reviewsResponse = await microCMSGet("reviews", { limit: "100" });
  const reviews = reviewsResponse.contents ?? [];

  await rm(OUTPUT_ROOT, { recursive: true, force: true });
  await mkdir(OUTPUT_FILMS, { recursive: true });

  await writeFile(
    path.join(OUTPUT_ROOT, "site.png"),
    renderPng(createSiteSvg()),
  );

  await Promise.all(
    reviews.map((review) =>
      writeFile(
        path.join(OUTPUT_FILMS, `${review.film.slug}.png`),
        renderPng(createFilmSvg(review)),
      ),
    ),
  );

  console.log(`Generated ${reviews.length + 1} OGP images in ${OUTPUT_ROOT}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
