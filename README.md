[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/sofyanadirs-sketch/gta6-trophy-guide-01-entry/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/sofyanadirs-sketch/gta6-trophy-guide-01-entry/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

# Leonida Platinum Road — GTA 6 trophy guide & tracker

An offline guide and tracker for all **55 GTA 6 trophies on PlayStation 5** (1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden). Built for the [make.fun GTA 6 trophy guide bounty](https://make.fun/c/gta6-trophy-guide-01).

## What it is

- **Every trophy, official and cited.** Each trophy shows its official name, description and grade exactly as PlayStation publishes them (via Exophase and PSNProfiles), plus a guide in this entry's own words that names its sources beside it.
- **A tracker.** A checklist saved in the browser (localStorage), with export to a file and import back.
- **Filters by kind** — story, missable, collectibles, activities, online — plus search and a grade filter. This list has no online trophies; the filter says so instead of showing an empty list.
- **A spoiler setting** that hides the names and descriptions of story trophies until you earn them.
- **A roadmap to the platinum** in 9 stages, built from the official descriptions: story chapters and missions, collectibles and counts, in order.
- **The missables flagged.** One trophy can be missed — Positive Mental Attitude, the Chapter 1 balcony meditation — and the guide says exactly when and how, with the save discipline that keeps a playthrough safe.
- **Honest about what is not verified.** GTA 6 launched 19 Nov 2026; five cryptic trophies have no confirmed trigger yet, and the guide says so plainly instead of inventing locations.

## Run it

Static files, no build step. Serve `app/` with any static server:

```sh
node serve.ts
```

Then open http://localhost:8080. It works with the network off: every file it loads lives under `app/`.

## Files

- `app/index.html`, `app/style.css`, `app/app.js` — the guide itself
- `app/data/trophies.json` — the 55 trophies with official names, descriptions, grades, hidden flags, PSN progress targets, roadmap stages and cited guides
- `screenshots/` — 4 real renders of the guide in Chromium
- `main.ts` — the entry program: copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library
- `vendor/makefun-frontend.ts` — the kit's library, unchanged

## License

MIT — see [LICENSE](LICENSE).
