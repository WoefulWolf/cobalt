import { nanoid } from 'nanoid';
import { env } from "../config.js";
import { Green, Red } from "../misc/console-text.js";
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

export function shortenUrl(longUrl, metadata = {}) {
  const id = nanoid(7);
  urlMap[id] = {
    url: longUrl,
    ...metadata,
    created: Date.now()
  };
  save();
  return id;
}

export function resolveUrl(id) {
  const entry = urlMap[id];
  if (!entry) return null;

  // Handle old format (direct string URLs)
  if (typeof entry === 'string') {
    return { url: entry };
  }

  return entry;
}

export function generateEmbedHtml(data) {
  const { url, title, description, thumbnail, video, audio, videoWidth, videoHeight, videoType } = data;

  const ogTags = [];

  // Basic OG tags
  ogTags.push(`<meta property="og:url" content="${escapeHtml(url)}">`);

  if (title) {
    ogTags.push(`<meta property="og:title" content="${escapeHtml(title)}">`);
    ogTags.push(`<meta name="twitter:title" content="${escapeHtml(title)}">`);
  }

  if (description) {
    ogTags.push(`<meta property="og:description" content="${escapeHtml(description)}">`);
    ogTags.push(`<meta name="twitter:description" content="${escapeHtml(description)}">`);
  }

  if (thumbnail) {
    ogTags.push(`<meta property="og:image" content="${escapeHtml(thumbnail)}">`);
    ogTags.push(`<meta name="twitter:image" content="${escapeHtml(thumbnail)}">`);
    ogTags.push(`<meta name="twitter:card" content="summary_large_image">`);
  }

  // Video-specific tags
  if (video) {
    ogTags.push(`<meta property="og:type" content="video.other">`);
    ogTags.push(`<meta property="og:video" content="${escapeHtml(video)}">`);
    ogTags.push(`<meta property="og:video:url" content="${escapeHtml(video)}">`);
    ogTags.push(`<meta property="og:video:secure_url" content="${escapeHtml(video)}">`);

    if (videoType) {
      ogTags.push(`<meta property="og:video:type" content="${escapeHtml(videoType)}">`);
    }

    if (videoWidth) {
      ogTags.push(`<meta property="og:video:width" content="${videoWidth}">`);
    }

    if (videoHeight) {
      ogTags.push(`<meta property="og:video:height" content="${videoHeight}">`);
    }

    ogTags.push(`<meta name="twitter:card" content="player">`);
    if (thumbnail) {
      ogTags.push(`<meta name="twitter:player" content="${escapeHtml(video)}">`);
      if (videoWidth) ogTags.push(`<meta name="twitter:player:width" content="${videoWidth}">`);
      if (videoHeight) ogTags.push(`<meta name="twitter:player:height" content="${videoHeight}">`);
    }
  }

  // Audio-specific tags
  if (audio) {
    ogTags.push(`<meta property="og:type" content="music.song">`);
    ogTags.push(`<meta property="og:audio" content="${escapeHtml(audio)}">`);
    ogTags.push(`<meta property="og:audio:url" content="${escapeHtml(audio)}">`);
    ogTags.push(`<meta property="og:audio:secure_url" content="${escapeHtml(audio)}">`);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title || 'Redirecting...')}</title>
  ${ogTags.join('\n  ')}
  <meta http-equiv="refresh" content="0;url=${escapeHtml(url)}">
  <script>
    window.location.href = ${JSON.stringify(url)};
  </script>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .message {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="message">
    <h1>Redirecting...</h1>
    <p>If you are not redirected automatically, <a href="${escapeHtml(url)}">click here</a>.</p>
  </div>
</body>
</html>`;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}