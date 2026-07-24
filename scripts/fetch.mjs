import Parser from 'rss-parser';
import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';

const parser = new Parser({ timeout: 15000 });

export function loadFeeds(path = new URL('../feeds.yaml', import.meta.url)) {
  const raw = readFileSync(path, 'utf8');
  const feeds = parseYaml(raw);
  if (!Array.isArray(feeds) || feeds.length === 0) {
    throw new Error('feeds.yaml must contain a non-empty list of {id, name, url}');
  }
  return feeds;
}

export async function fetchFeedItems(feed) {
  try {
    const parsed = await parser.parseURL(feed.url);
    return (parsed.items || []).map((item) => ({
      title: item.title?.trim() ?? '',
      link: item.link ?? '',
      publishedAt: item.isoDate ?? item.pubDate ?? null,
    })).filter((item) => item.title && item.link && item.publishedAt);
  } catch (err) {
    console.warn(`[fetch] ${feed.id}: failed to fetch/parse (${err.message})`);
    return [];
  }
}

export async function fetchAllFeedItems(feeds) {
  const itemsByFeedId = {};
  for (const feed of feeds) {
    itemsByFeedId[feed.id] = await fetchFeedItems(feed);
  }
  return itemsByFeedId;
}
