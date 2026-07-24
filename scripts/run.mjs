import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadFeeds, fetchAllFeedItems } from './fetch.mjs';
import { pickToday } from './rotate.mjs';
import { renderSite } from './render.mjs';

const STATE_PATH = fileURLToPath(new URL('../state.json', import.meta.url));

function loadState() {
  return JSON.parse(readFileSync(STATE_PATH, 'utf8'));
}

function saveState(state) {
  writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

async function main() {
  const feeds = loadFeeds();
  const state = loadState();

  console.log(`[run] fetching ${feeds.length} feeds...`);
  const itemsByFeedId = await fetchAllFeedItems(feeds);

  const { pick, nextFeedIndex } = pickToday(feeds, state, itemsByFeedId);

  if (pick) {
    console.log(`[run] picked "${pick.title}" (${pick.feedName})`);
    state.history.push(pick);
  } else {
    console.warn('[run] no fresh, unused item found across any feed today — skipping pick');
  }
  state.feedIndex = nextFeedIndex;

  saveState(state);
  renderSite(state.history);
  console.log('[run] rendered public/feed.xml and public/index.html');
}

main().catch((err) => {
  console.error('[run] fatal error:', err);
  process.exitCode = 1;
});
