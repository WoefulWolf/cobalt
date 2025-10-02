import { nanoid } from 'nanoid';
import { env } from "../config.js";
import { Green } from "../misc/console-text.js";
import fs from 'fs';

const dbFile = env.shortUrlsPath || null;

let urlMap = {};


export function loadDb() {
    if (dbFile && fs.existsSync(dbFile)) {
        urlMap = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
        console.log(`${Green('[✓]')} short urls db loaded successfully!`);
    }
}

function save() {
  if (dbFile) {
    fs.writeFileSync(dbFile, JSON.stringify(urlMap, null, 2));
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