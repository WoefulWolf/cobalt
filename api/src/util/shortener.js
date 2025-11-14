import { nanoid } from "nanoid";
import { env } from "../config.js";
import { Green, Red } from "../misc/console-text.js";
import fs from "fs";
import path from "path";

const dbDir = env.shortUrlsDir || null;
const dbFile = dbDir ? path.join(dbDir, "urls.json") : null;

let urlMap = {};

// Utility to check if an Instagram CDN URL has expired
export function isInstagramUrlExpired(url) {
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes("cdninstagram.com")) {
      return false; // Not an Instagram CDN URL
    }

    const oeParam = urlObj.searchParams.get("oe");
    if (!oeParam) {
      return false; // No expiration parameter
    }

    // Convert hex timestamp to decimal
    const expirationTimestamp = parseInt(oeParam, 16) * 1000;
    const now = Date.now();

    // Consider expired if within 1 hour of expiration to be safe
    const bufferTime = 60 * 60 * 1000; // 1 hour in milliseconds
    return now >= expirationTimestamp - bufferTime;
  } catch {
    return false; // If parsing fails, assume not expired
  }
}

// Extract Instagram post ID from a CDN URL path
export function extractInstagramPostId(url) {
  try {
    const urlObj = new URL(url);
    // Instagram CDN URLs don't contain the post ID directly
    // We'll need to store it separately in metadata
    return null;
  } catch {
    return null;
  }
}

if (dbDir) {
  try {
    fs.mkdirSync(dbDir, { recursive: true });
  } catch (err) {
    console.error(`${Red("[✗]")} Failed to create short URL directory:`, err);
  }
}

export function loadDb() {
  if (dbFile && fs.existsSync(dbFile)) {
    const content = fs.readFileSync(dbFile, "utf8").trim();
    if (content) {
      try {
        urlMap = JSON.parse(content);
        console.log(`${Green("[✓]")} short urls db loaded successfully!`);
      } catch (err) {
        console.error(`${Red("[✗]")} Failed to parse short urls db:`, err);
        urlMap = {};
      }
    } else {
      urlMap = {};
    }
  }
}

function save() {
  if (!dbFile) return;

  try {
    fs.writeFileSync(dbFile, JSON.stringify(urlMap, null, 2));
  } catch (err) {
    console.error(
      `${Red("[✗]")} Failed to save short urls db, running in-memory only:`,
      err,
    );
  }
}

export function shortenUrl(longUrl, metadata = {}) {
  const id = nanoid(7);
  urlMap[id] = {
    url: longUrl,
    metadata: {
      ...metadata,
      createdAt: Date.now(),
    },
  };
  save();
  return id;
}

export function resolveUrl(id) {
  const entry = urlMap[id];
  if (!entry) return null;

  // Support legacy format (direct string URLs)
  if (typeof entry === "string") {
    return entry;
  }

  return entry.url;
}

export function getUrlMetadata(id) {
  const entry = urlMap[id];
  if (!entry || typeof entry === "string") {
    return null;
  }
  return entry.metadata || null;
}

export function updateUrl(id, newUrl) {
  const entry = urlMap[id];
  if (!entry) return false;

  if (typeof entry === "string") {
    // Migrate legacy format
    urlMap[id] = {
      url: newUrl,
      metadata: { createdAt: Date.now(), updated: true },
    };
  } else {
    urlMap[id].url = newUrl;
    urlMap[id].metadata.updatedAt = Date.now();
  }

  save();
  return true;
}
