import { createHash } from 'node:crypto';

const TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'gclid', 'mc_cid', 'mc_eid', 'ref', 'ref_src',
];

export function canonicalizeLink(rawLink) {
  try {
    const url = new URL(rawLink);
    for (const param of TRACKING_PARAMS) url.searchParams.delete(param);
    url.hash = '';
    return url.toString();
  } catch {
    return rawLink;
  }
}

export function hashLink(canonicalLink) {
  return createHash('sha1').update(canonicalLink).digest('hex');
}

export function htmlEscape(str) {
  return String(str ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}
