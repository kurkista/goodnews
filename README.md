# GoodNews

One good, constructive-news story a day, relayed as RSS — no signup, no
tracking, no mailing list. Live at [goodnews.kurkista.fi](https://goodnews.kurkista.fi/).

## How it works

Once a day, a GitHub Actions workflow ([`.github/workflows/daily.yml`](.github/workflows/daily.yml)):

1. Fetches every feed in [`feeds.yaml`](feeds.yaml).
2. Picks one fresh, not-yet-used story via simple round-robin rotation
   across sources (`scripts/rotate.mjs`) — no editorial judgment, no LLM.
3. Renders `public/feed.xml` and `public/index.html` (`scripts/render.mjs`).
4. Commits the result (`state.json` + `public/`) and deploys it to Fly.io.

There's no database — `state.json`, committed to this repo, holds the
rotation pointer and pick history and is the entire source of truth.

## Get it by email

GoodNews doesn't collect email addresses or run a mailing list — it only
publishes RSS. If you want it in your inbox, point a third-party
RSS-to-email bridge (e.g. [Blogtrottr](https://blogtrottr.com/),
[Feedrabbit](https://feedrabbit.com/), or
[Kill the Newsletter](https://kill-the-newsletter.com/) run in reverse) at
`https://goodnews.kurkista.fi/feed.xml` yourself. That's a relationship
between you and that service — GoodNews never sees or stores your address.

## Local development

```
npm install
npm run generate
```

This fetches all feeds, updates `state.json`, and regenerates `public/`.

## Copyright

GoodNews links to and quotes only the verbatim headline of each story —
never full text or a source's own summary. It claims no ownership of, and
is not responsible for the accuracy of, any linked content; that remains
with the original publisher. See the disclaimer in `scripts/render.mjs` and
the site footer.

## License

Code: MIT. Content is not GoodNews's to license — see Copyright above.
