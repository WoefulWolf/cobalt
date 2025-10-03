import { nanoid } from 'nanoid';
import { env } from "../config.js";
import { Green } from "../misc/console-text.js";
import fs from 'fs';
import path from 'path';

const dbDir = env.shortUrlsDir || null;
const dbFile = dbDir ? path.join(dbDir, 'urls.json') : null;

let urlMap = {};

if (dbDir) {
  try {
    fs.mkdirSync(dbDir, { recursive: true });
  } catch (err) {
    console.error(`${Red('[✗]')} Failed to create short URL directory:`, err);
  }
}

export function loadDb() {
  if (dbFile && fs.existsSync(dbFile)) {
    const content = fs.readFileSync(dbFile, 'utf8').trim();
    if (content) {
      try {
        urlMap = JSON.parse(content);
        console.log(`${Green('[✓]')} short urls db loaded successfully!`);
      } catch (err) {
        console.error(`${Red('[✗]')} Failed to parse short urls db:`, err);
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
    console.error(`${Red('[✗]')} Failed to save short urls db, running in-memory only:`, err);
  }
}

export function shortenUrl(longUrl) {
  const id = nanoid(7);
  urlMap[id] = longUrl;
  save();
  return id;
}

export function resolveUrl(id) {
  return urlMap[id] || null;
}