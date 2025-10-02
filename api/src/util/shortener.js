import { nanoid } from 'nanoid';
import { env } from "../config.js";
import { Green } from "../misc/console-text.js";
import fs from 'fs';

const dbFile = env.shortUrlsPath || null;

let urlMap = {};


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