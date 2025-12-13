// exophase-achievements-images.js
// npm i axios cheerio

const axios = require("axios");
const cheerio = require("cheerio");

const BASE = "https://www.exophase.com";

// In the exact order you want to try
const PLATFORMS = [
  "psn",
  "xbox",
  "steam",
  "origin",
  "blizzard",
  "retro",
  "android",
  "gog",
  "ubisoft",
  "stadia",
  "epic",
  "nintendo",
  "apple",
  "ps3"
];

function slugifyGameName(input) {
  return String(input)
    .trim()
    .toLowerCase()
    // turn & into "and" (optional but helps)
    .replace(/&/g, "and")
    // keep letters/numbers, convert everything else to hyphen
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toAbs(url) {
  if (!url) return null;
  if (url.startsWith("//")) return "https:" + url;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return BASE + url;
  return url;
}

async function fetchHtml(url) {
  const res = await axios.get(url, {
    timeout: 20000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
    // Don't throw on 404 so we can detect it ourselves
    validateStatus: () => true,
  });

  return { status: res.status, html: res.data };
}

function isPageNotFound(status, html) {
  if (status === 404) return true;
  const $ = cheerio.load(html || "");
  const title = ($("title").text() || "").toLowerCase();
  const h1 = ($("h1").first().text() || "").toLowerCase();
  const bodyText = ($("body").text() || "").toLowerCase();

  // Covers common variants
  return (
    title.includes("page not found") ||
    h1.includes("page not found") ||
    bodyText.includes("page not found")
  );
}

async function findFirstWorkingAchievementsUrl(gameQuery) {
  const slug = slugifyGameName(gameQuery);

  // Try with "-<platform>" suffix first
  const candidates = PLATFORMS.map(
    (p) => `${BASE}/game/${slug}-${p}/achievements/`
  );

  // (Optional) fallback: also try without platform suffix at the end
  candidates.push(`${BASE}/game/${slug}/achievements/`);

  for (const url of candidates) {
    const { status, html } = await fetchHtml(url);

    // If blocked (403/429) you'll want Playwright, but this works for normal pages
    if (status >= 500) continue;

    if (!isPageNotFound(status, html)) {
      return { url, html };
    }
  }

  return null;
}

function extractAllImages(html) {
  const $ = cheerio.load(html);
  const urls = new Set();

  $("img").each((_, el) => {
    const $img = $(el);

    const raw =
      $img.attr("data-src") ||
      $img.attr("src") ||
      // take first candidate from srcset
      (($img.attr("data-srcset") || $img.attr("srcset") || "").split(",")[0] || "")
        .trim()
        .split(" ")[0];

    const abs = toAbs(raw);
    if (abs) urls.add(abs);
  });

  return [...urls];
}

async function main() {
  const query = process.argv.slice(2).join(" ") || "fifa-16";

  console.log("Game query:", query);

  const result = await findFirstWorkingAchievementsUrl(query);
  if (!result) {
    console.error("No working achievements page found for:", query);
    process.exit(1);
  }

  console.log("✅ Working achievements URL:", result.url);

  const images = extractAllImages(result.html);

  console.log(`\nFound ${images.length} image(s):\n`);
  for (const img of images) console.log(img);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
