# goodnews — sunset record (2026-10-14)

GoodNews is **paused, not deleted**. This records the exact state so it can be
resurrected later without archaeology.

## State as of 2026-10-14

| Piece | State |
|---|---|
| GitHub workflow `Daily pick` (cron `0 4 * * *` UTC) | **disabled** 2026-10-14. Last pick: `chore: daily pick 2026-10-13` |
| Repo | archived (read-only), public |
| Fly app `goodnews` (arn, shared-cpu-1x, 256 MB, nginx:alpine static) | **left deployed** with the last pick; machines auto-stop (`min_machines_running = 0`), so it costs ~nothing. No volume |
| Custom domain | `goodnews.kurkista.fi` (Fly-issued cert). Still serves the last pick and `/feed.xml`; the feed just stops updating |
| Fly IPs | dedicated IPv6 `2a09:8280:1::153:bb0f:0`, shared IPv4 `66.241.124.245` |
| GitHub secret | `FLY_API_TOKEN` (used by the workflow's deploy step) |
| Fly secrets | none |
| Subscribers | The owner is subscribed via Blogtrottr to `https://goodnews.kurkista.fi/feed.xml` (external account, not managed here). The project stores no subscriber data by design |
| Source of truth | `state.json` (rotation pointer + pick history), `feeds.yaml` (vetted sources) |

## Resurrecting

1. Unarchive: `gh repo unarchive kurkista/goodnews`
2. Re-enable: `gh workflow enable "Daily pick" -R kurkista/goodnews`
3. If the deploy fails, check `FLY_API_TOKEN` is still valid (`flyctl tokens create deploy -a goodnews`, then `gh secret set FLY_API_TOKEN -R kurkista/goodnews`).
4. Check the Fly account is not suspended and `https://goodnews.kurkista.fi/healthz` returns 200.
5. Trigger once by hand: `gh workflow run "Daily pick" -R kurkista/goodnews`. Rotation continues from `state.json`; there is no backlog, one story a day.

## Full teardown (not done)

`flyctl apps destroy goodnews`, remove the `goodnews` DNS record for kurkista.fi (owner-only, at the DNS host),
delete the `FLY_API_TOKEN` secret, and cancel the Blogtrottr subscription in the owner's Blogtrottr account.
