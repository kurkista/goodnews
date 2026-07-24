import { canonicalizeLink, hashLink } from './util.mjs';

const FRESHNESS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// Round-robin across feeds starting at state.feedIndex; first feed with an
// eligible (fresh, not-already-used) item wins. One full sweep max — never
// loops forever, and a day with nothing fresh anywhere is a valid no-op.
export function pickToday(feeds, state, itemsByFeedId, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  if (state.history.some((h) => h.date === today)) {
    // Already picked today — reruns (manual retry, workflow_dispatch) must
    // be idempotent, not add a second pick for the same day.
    return { pick: null, nextFeedIndex: state.feedIndex };
  }

  const seenHashes = new Set(state.history.map((h) => h.guid));
  const n = feeds.length;

  for (let step = 0; step < n; step++) {
    const idx = (state.feedIndex + step) % n;
    const feed = feeds[idx];
    const items = itemsByFeedId[feed.id] ?? [];

    const eligible = items
      .map((item) => {
        const canonicalLink = canonicalizeLink(item.link);
        return { ...item, canonicalLink, guid: hashLink(canonicalLink) };
      })
      .filter((item) => {
        const published = new Date(item.publishedAt);
        if (Number.isNaN(published.getTime())) return false;
        if (now - published > FRESHNESS_WINDOW_MS) return false;
        if (seenHashes.has(item.guid)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    if (eligible.length > 0) {
      const chosen = eligible[0];
      return {
        pick: {
          date: now.toISOString().slice(0, 10),
          feedId: feed.id,
          feedName: feed.name,
          title: chosen.title,
          link: chosen.canonicalLink,
          guid: chosen.guid,
          publishedAt: chosen.publishedAt,
        },
        nextFeedIndex: (idx + 1) % n,
      };
    }
  }

  // Full sweep found nothing — leave feedIndex untouched, resume from the
  // same point tomorrow.
  return { pick: null, nextFeedIndex: state.feedIndex };
}
