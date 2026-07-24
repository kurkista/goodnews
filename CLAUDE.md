# goodnews — Claude Code context

A daily good-news RSS relay: one story a day, picked by rotation from a
small list of vetted sources, published as RSS + a static page. One-person
hobby project, near-$0/mo hosting, sibling to
[tutka](https://github.com/kurkista/tutka). Not a business, not a
newsroom — a relay.

---

## Architecture — locked decisions

- **Hosting:** Fly.io, app name `goodnews`, region `arn` (Stockholm),
  `fly.toml` at repo root. Serves a fully static `public/` directory via
  `nginx:alpine` — no Node runtime in production, because there is no
  runtime logic: everything is pre-rendered by the daily workflow.
  Scale-to-zero (`auto_stop_machines = 'stop'`, `min_machines_running = 0`)
  is safe here, unlike tutka, because there's no in-process scheduler or
  websocket connection that needs an always-on machine.
- **No database, no volume.** `state.json` (rotation pointer + one history
  row per day) is committed to git by the daily workflow and is the entire
  source of truth. If it disagrees with what's live, git is right.
- **Selection:** dumb round-robin across `feeds.yaml`, 7-day freshness
  window, exact-link dedup against `state.json.history`. No LLM, no
  editorial judgment, in v1. A day with nothing fresh anywhere is a valid
  no-op, not an error — see `scripts/rotate.mjs`.
- **Pipeline:** one daily GitHub Actions workflow
  (`.github/workflows/daily.yml`) does the whole thing — fetch → rotate →
  render → commit → deploy. No server-side cron, no queue.
- **Sources:** `feeds.yaml` is fully independent of, and deliberately
  decoupled from, the owner's separate FreshRSS instance at
  rss.kurkista.fi. Don't wire this project to that one, even if it looks
  convenient — that coupling was considered and rejected on purpose.

---

## Non-negotiable rules

**No subscriber data, ever**
The entire point of going RSS-only instead of email was to avoid becoming
a GDPR data controller. Never add a signup form, mailing list, analytics
that captures visitor identity, or any other mechanism that stores PII.
Third-party RSS-to-email bridges are the answer for anyone who wants
email — that's their relationship with that service, not ours.

**Never reproduce article content**
Item descriptions in the feed are always GoodNews's own boilerplate
("{{source}} — read the full story at the original source"), never a
source's dek/summary text. Headlines are used verbatim (short factual
headlines generally aren't independently copyrightable; a publisher's
summary paragraph is their creative expression, so it's excluded even
though it might feel like "just a summary").

**The copyright/no-responsibility disclaimer must stay present**
Two distinct claims, both required: (1) no ownership of or hosting of
linked content, and (2) no responsibility for the relayed content or its
factual accuracy. It must appear in both the feed's channel-level
`copyright` field and the site footer (`scripts/render.mjs`
`DISCLAIMER`). Don't let a refactor drop either half.

**`feeds.yaml` is the only routine content edit**
If maintaining this project starts requiring touches to `scripts/*.mjs` on
a regular basis, something has drifted from the "low-maintenance relay"
goal — flag it rather than normalizing it.

**Secrets**
Never in tracked files. `.env` is gitignored and is the only local copy —
live secrets are GitHub Actions repo secrets (currently just
`FLY_API_TOKEN`), never `fly.toml` vars or workflow `env:` literals.

**Save new secrets locally before setting them remotely**
Write any new key/token to `.env` first, then set it as a GitHub secret.
Both GitHub Actions secrets and Fly secrets are write-only stores — a
value set without a local copy first is gone if you ever need it again.

**Keep shared names in sync across `fly.toml` and workflows in one commit**
If the Fly app name, region, or a secret name changes, update
`.github/workflows/daily.yml` in the same commit — not as a follow-up. A
split change risks the scheduled job silently running against the old
name for a full cycle.

**Renaming or migrating live infrastructure needs explicit, per-action
sign-off**
The repo name, the Fly app, and `goodnews.kurkista.fi` are shared/public
surfaces. Never rename, recreate, or migrate any of them speculatively.

**DNS is owner-only**
The `goodnews.kurkista.fi` CNAME lives in the 1984.is FreeDNS panel for
kurkista.fi — Claude has no access to that zone. Any DNS change is a
manual step for the owner.

**No new tracking/ceremony files**
One-person project — don't introduce session-log or status-file machinery
uninvited. State lives in README/CLAUDE.md, git history, and `state.json`.

**LLM-assisted selection is out of scope for v1**
Upgrading the daily pick from rotation to an LLM-assisted choice (using
the owner's existing Anthropic key) was discussed and deliberately
deferred, not forgotten. Don't add it without an explicit go-ahead.

**Vendor/service recommendations**
Before recommending a new paid or data-handling third-party service,
check its actual pricing and jurisdiction (not from memory) and say so
explicitly. The owner generally prefers EU-based/self-hosted options when
a viable one exists.
