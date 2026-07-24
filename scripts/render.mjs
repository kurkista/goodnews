import { Feed } from 'feed';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { htmlEscape } from './util.mjs';

const SITE_URL = 'https://goodnews.kurkista.fi/';
const FEED_URL = `${SITE_URL}feed.xml`;

export const DISCLAIMER =
  'GoodNews claims no ownership of, and does not host, any linked content. ' +
  'We are not responsible for the relayed content or its factual accuracy — ' +
  'full rights and responsibility for accuracy remain with the original publishers.';

const PUBLIC_DIR = fileURLToPath(new URL('../public/', import.meta.url));

function renderFeedXml(history) {
  const feed = new Feed({
    title: 'GoodNews',
    description: `One good, constructive-news story a day, relayed from vetted sources. ${DISCLAIMER}`,
    id: SITE_URL,
    link: SITE_URL,
    language: 'en',
    copyright: DISCLAIMER,
    updated: history.length ? new Date(history[history.length - 1].publishedAt) : new Date(),
    generator: 'goodnews (github.com/kurkista/goodnews)',
    feedLinks: { rss: FEED_URL },
    author: { name: 'kurkista' },
  });

  // Newest first; feed history is stored oldest-to-newest.
  for (const pick of [...history].reverse()) {
    feed.addItem({
      title: pick.title,
      id: pick.guid,
      link: pick.link,
      description: `${pick.feedName} — read the full story at the original source.`,
      author: [{ name: 'kurkista' }],
      date: new Date(pick.publishedAt),
      category: [{ name: pick.feedName }],
    });
  }

  return feed.rss2();
}

function renderIndexHtml(history) {
  const latest = [...history].reverse().slice(0, 14);

  const items = latest.length
    ? latest.map((pick) => `
      <li>
        <span class="date">${htmlEscape(pick.date)}</span>
        <a href="${htmlEscape(pick.link)}" rel="noopener noreferrer">${htmlEscape(pick.title)}</a>
        <span class="source">${htmlEscape(pick.feedName)}</span>
      </li>`).join('\n')
    : '<li class="empty">No picks yet — check back tomorrow.</li>';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GoodNews — one good story a day</title>
<link rel="alternate" type="application/rss+xml" title="GoodNews" href="/feed.xml">
<style>
  body { font-family: system-ui, sans-serif; max-width: 640px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; color: #1a1a1a; }
  header { margin-bottom: 2rem; }
  h1 { margin-bottom: 0.25rem; }
  .tagline { color: #555; }
  ul.picks { list-style: none; padding: 0; }
  ul.picks li { padding: 0.75rem 0; border-bottom: 1px solid #eee; }
  ul.picks li.empty { color: #777; }
  .date { color: #888; font-size: 0.85em; margin-right: 0.5em; }
  .source { display: block; color: #888; font-size: 0.85em; }
  section { margin-top: 2.5rem; }
  footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #eee; color: #777; font-size: 0.85em; }
</style>
</head>
<body>
<header>
  <h1>GoodNews</h1>
  <p class="tagline">One good, constructive-news story a day, relayed from vetted sources. No signup, no tracking — just <a href="/feed.xml">RSS</a>.</p>
</header>

<ul class="picks">
${items}
</ul>

<section>
  <h2>Get it by email</h2>
  <p>GoodNews doesn't collect email addresses or run a mailing list — it only publishes an RSS feed. If you want it in your inbox, point a third-party RSS-to-email bridge (for example <a href="https://blogtrottr.com/">Blogtrottr</a>, <a href="https://feedrabbit.com/">Feedrabbit</a>, or <a href="https://kill-the-newsletter.com/">Kill the Newsletter</a>, run in reverse) at:</p>
  <p><code>${htmlEscape(FEED_URL)}</code></p>
  <p>That's a relationship between you and that service — GoodNews never sees or stores your address.</p>
</section>

<section>
  <h2>About</h2>
  <p>GoodNews is a small, low-maintenance relay: each day it rotates through a short list of vetted good/solutions-news outlets and links to one fresh story, with no editorial pick beyond rotation. It's a relay, not a newsroom — full credit and responsibility for every story belongs to the outlet that published it.</p>
</section>

<footer>
  <p>${htmlEscape(DISCLAIMER)}</p>
</footer>
</body>
</html>
`;
}

export function renderSite(history) {
  mkdirSync(PUBLIC_DIR, { recursive: true });
  writeFileSync(`${PUBLIC_DIR}feed.xml`, renderFeedXml(history), 'utf8');
  writeFileSync(`${PUBLIC_DIR}index.html`, renderIndexHtml(history), 'utf8');
}
