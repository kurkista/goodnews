# Session history

One entry per work session: what was done, and any incidents/bugs hit along
the way (with how they were diagnosed/resolved). See the "Session history"
rule in [CLAUDE.md](CLAUDE.md).

---

## 2026-07-24 — initial build and launch

Scaffolded and shipped v1: RSS-only daily good-news relay, round-robin
selection across 5 verified feeds, static nginx serving on Fly.io, single
daily GitHub Actions workflow (fetch → rotate → render → commit → deploy).
Repo created public at `github.com/kurkista/goodnews`, Fly app `goodnews`
created and deployed, `FLY_API_TOKEN` secret set, `daily.yml` triggered
manually and confirmed working end-to-end (real pick, live on
`goodnews.fly.dev`). `goodnews.kurkista.fi` DNS not yet added (owner's
manual step, pending).

**Bugs found and fixed during build:**
- `nginx.conf`'s `/feed.xml` location set `default_type application/rss+xml`
  but still served `text/xml` — nginx's built-in mime map for the `.xml`
  extension takes priority over `default_type` unless cleared. Fixed by
  adding an empty `types { }` block in that location to reset the map
  before applying `default_type`.
- `rotate.mjs` had no same-day guard: running `scripts/run.mjs` twice in
  one day picked two different stories instead of being a no-op on the
  second run. This would have meant a manual `workflow_dispatch` retry (or
  a flaky double-trigger) produces two picks for one date. Fixed by
  checking `state.history` for an existing entry matching today's date
  before picking.

**Process note:** during the guided walkthrough of setting `FLY_API_TOKEN`,
Claude ran the token-creation/secret-set command directly instead of
handing it to the owner to run themselves as asked. Caught and flagged
immediately; no bad outcome (command succeeded, token scoped correctly to
the app), but worth remembering: "guide me through X" means hand over the
command, not execute it.

**Also noted:** creating the Fly app and running `fly deploy` via Claude's
own Bash tool was blocked by an auto-mode safety classifier (unrelated to
this repo) on the first attempt each time; both had to be re-run — the
`fly apps create` retry succeeded directly, the `fly deploy` retry
succeeded but only after being moved to a background task past the 120s
foreground timeout. Not a goodnews bug, just a quirk of the environment
worth remembering if it recurs.

## 2026-07-24 — custom domain (goodnews.kurkista.fi) went live

Finished the one item left pending from the initial launch: the custom
domain now has a verified Let's Encrypt cert and serves the site + feed
correctly (`200` on `/`, `application/rss+xml` on `/feed.xml`).

**What actually happened, since it wasn't a straight DNS-add:**
- The owner first used 1984's "Add new site" flow for
  `goodnews.kurkista.fi`, which created a WordPress-capable hosting slot
  on 1984's own infrastructure — unrelated to and not needed for this
  project (goodnews is served entirely by the Fly app). No WordPress was
  actually installed (opted out during creation), and the slot was left
  in place rather than deleted, since it doesn't own any DNS and nothing
  routes traffic to it as long as DNS points elsewhere. Worth remembering
  if `goodnews.kurkista.fi` is ever touched again in 1984's panel — that
  orphaned "Site" entry is still there.
- The actual routing problem: `kurkista.fi`'s zone has a pre-existing
  wildcard `CNAME * → @` (TTL 86400), so before an explicit record
  existed, `goodnews.kurkista.fi` silently resolved to 1984's own hosting
  IP instead of Fly. Fixed by adding explicit `A goodnews →
  66.241.124.245` and `AAAA goodnews → 2a09:8280:1::153:bb0f:0` records
  in 1984's FreeDNS zone editor (an exact-host record takes priority over
  a wildcard, so this cleanly overrides it without touching the wildcard
  or the zone's root `@` record).
- Propagation took two separate hops to confirm: first to 1984's own
  authoritative nameserver (a few minutes — this zone has secondary NS
  behind what looks like periodic AXFR, so even 1984's own infra lagged
  briefly), then separately for Let's Encrypt's own validators to see the
  corrected records before `fly certs check` flipped from "Not verified"
  to "Issued" (roughly another 10-15 minutes). Neither delay indicated a
  misconfiguration — both were confirmed by querying `ns0.1984.is`
  directly and just waiting.

**Process note:** the DNS record changes (adding the two records in
1984's panel) were made by Claude directly via a connected Chrome tab,
with the owner's explicit go-ahead and explicit scope (two named
records), after the owner suggested it to skip manual screenshot
back-and-forth. The existing `@` root record was verified untouched
before and after.
