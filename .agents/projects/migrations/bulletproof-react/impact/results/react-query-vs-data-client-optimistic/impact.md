# bulletproof-react: react-query vs data-client with optimistic updates

- Flow: 8 interleaved runs per variant at 4x CPU throttle; 13 steps (6 mutations).
- Feature cost: "Comment counts that stay in sync", 2 runs per variant, model sonnet at medium effort. Errored agent sessions count as failed acceptance; their spend stays in the medians when the CLI reported it (a timeout or crash reports none).
- Agent guidance in the react-query copy: `AGENTS.md`.
- Agent guidance in the data-client + optimistic copy: `AGENTS.md`.
- Sampled rows show median (interquartile range); the change column adds a 95% bootstrap interval in brackets. "Within noise" means that interval includes zero.

## Setup

| Variant | Commit | Uncommitted files | Working-tree diff sha1 |
| --- | --- | --- | --- |
| react-query | 9506629ed003a561c6627735480cce4994244bb4 | 5 | b331326d588c |
| data-client + optimistic | fb6c863163fbfc202666d745d1596083ef374bc4 | 59 | 5f2c80fa6a7d |

Config `../data-client/.agents/projects/migrations/bulletproof-react/impact/impact.config.mjs`, prep `fixed-latency.patch`, Node v22.23.4, Playwright 1.65.0.

## Flow

| Metric | Unit | react-query | data-client + optimistic | Change | Verdict |
| --- | --- | --- | --- | --- | --- |
| Failed runs (left out) | runs | 0 | 0 | 0 | same |
| Mutation submit to UI updated (sum) | ms | 8,467 (8,439–8,500) | 2,781 (2,761–2,786) | -5,686 (-67.2%) [-5,735, -5,651] | better |
| Reads triggered by mutations | requests | 6 | 2 | -4 (-66.7%) | better |
| Stale views (checked views showing old data) | views | 2 | 0 | -2 (-100%) | better |
| All steps, action to ready (sum) | ms | 11,314 (11,292–11,365) | 5,629 (5,497–5,701) | -5,685 (-50.2%) [-5,854, -5,553] | better |
| API requests | requests | 15 | 10 | -5 (-33.3%) | better |
| API reads (GET) | requests | 9 | 4 | -5 (-55.6%) | better |
| API writes | requests | 6 | 6 | 0 | same |
| Redundant reads (same URL, same payload already received) | requests | 0 | 0 | 0 | same |
| Navigations with no loading indicator (of 7) | navs | 7 | 7 | 0 | same |
| Loading indicators shown | count | 0 | 0 | 0 | same |
| Loading indicator visible | ms | 0 | 0 | 0 | same |
| Long tasks (>50ms) | count | 0 | 1.5 (1–2.25) | +1.5 [+1, +2.5] | worse |
| Slowest interaction (input to next paint) | ms | 40 (40–44) | 76 (72–82) | +36 (+90%) [+24, +48] | worse |
| Layout shift (CLS sum) | score | 0 | 0 | 0 | same |
| Reads the redundancy check could not hash | requests | 0 | 0 | 0 | same |
| Total blocking time | ms | 0 | 18 (9.75–23.8) | +18 [+9, +32] | worse |

## Cold load

| Metric | Unit | react-query | data-client + optimistic | Change | Verdict |
| --- | --- | --- | --- | --- | --- |
| First screen ready | ms | 1,791 (1,730–2,041) | 1,756 (1,711–1,874) | -35.5 (-2%) [-440, +171] | within noise |
| Load event | ms | 472 (435–500) | 456 (429–467) | -16.5 (-3.5%) [-92.5, +43] | within noise |
| Largest contentful paint | ms | 1,718 (1,662–1,855) | 1,636 (1,600–1,761) | -82 (-4.8%) [-252, +80] | within noise |
| JS parse + compile | ms | 610 (560–680) | 551 (528–632) | -59.1 (-9.7%) [-150, +56.0] | within noise |
| JS module evaluation | ms | 557 (518–602) | 521 (471–550) | -35.5 (-6.4%) [-128, +50.3] | within noise |
| Main-thread JS | ms | 912 (846–1,034) | 814 (791–919) | -98.4 (-10.8%) [-244, +62.3] | within noise |
| Total blocking time | ms | 429 (386–502) | 389 (367–446) | -39.5 (-9.2%) [-133, +65.0] | within noise |
| Loading indicator visible | ms | 592 (576–597) | 0 | -592 (-100%) [-601, -573] | better |
| JS heap | MB | 8.11 (8.1–8.12) | 7.72 (7.71–7.74) | -0.39 (-4.8%) [-0.41, -0.36] | better |

## Nav steps

| Metric | Unit | react-query | data-client + optimistic | Change | Verdict |
| --- | --- | --- | --- | --- | --- |
| open discussions: action to ready | ms | 943 (929–959) | 941 (928–953) | -1.5 (-0.2%) [-28, +25] | within noise |
| open discussions: reads | requests | 1 | 1 | 0 | same |
| open discussion: action to ready | ms | 951 (945–963) | 950 (938–969) | -0.5 (-0.1%) [-31, +33] | within noise |
| open discussion: reads | requests | 2 | 1 | -1 (-50%) | better |
| back to list (shows rename?): action to ready | ms | 136 (119–139) | 115 (105–120) | -21 (-15.5%) [-35.5, +2] | within noise |
| back to list (shows rename?): reads | requests | 0 | 0 | 0 | same |
| reopen discussion (comment gone?): action to ready | ms | 107 (95.5–122) | 104 (89.8–109) | -3.5 (-3.3%) [-34.5, +12.5] | within noise |
| reopen discussion (comment gone?): reads | requests | 0 | 0 | 0 | same |
| profile: action to ready | ms | 523 (521–529) | 543 (530–561) | +20.5 (+3.9%) [-3, +43] | within noise |
| profile: reads | requests | 0 | 0 | 0 | same |
| dashboard (shows new name?): action to ready | ms | 94.5 (86.8–101) | 98 (87.8–101) | +3.5 (+3.7%) [-16.5, +17.5] | within noise |
| dashboard (shows new name?): reads | requests | 0 | 0 | 0 | same |
| list again: action to ready | ms | 114 (103–126) | 97 (90–111) | -16.5 (-14.5%) [-35, +14.5] | within noise |
| list again: reads | requests | 0 | 0 | 0 | same |

## Mutation steps

| Metric | Unit | react-query | data-client + optimistic | Change | Verdict |
| --- | --- | --- | --- | --- | --- |
| create discussion: submit to UI updated | ms | 1,427 (1,422–1,434) | 1,417 (1,401–1,429) | -10 (-0.7%) [-32, +7.5] | within noise |
| create discussion: follow-up reads | requests | 1 | 1 | 0 | same |
| update discussion: submit to UI updated | ms | 1,404 (1,392–1,423) | 111 (101–129) | -1,292 (-92.1%) [-1,320, -1,263] | better |
| update discussion: follow-up reads | requests | 1 | 0 | -1 (-100%) | better |
| create comment: submit to UI updated | ms | 1,400 (1,395–1,406) | 145 (138–159) | -1,255 (-89.6%) [-1,271, -1,236] | better |
| create comment: follow-up reads | requests | 1 | 0 | -1 (-100%) | better |
| delete comment: submit to UI updated | ms | 1,413 (1,393–1,419) | 94 (83–104) | -1,318 (-93.3%) [-1,335, -1,287] | better |
| delete comment: follow-up reads | requests | 1 | 0 | -1 (-100%) | better |
| update profile: submit to UI updated | ms | 1,407 (1,404–1,419) | 104 (102–109) | -1,302 (-92.6%) [-1,319, -1,294] | better |
| update profile: follow-up reads | requests | 1 | 0 | -1 (-100%) | better |
| delete discussion: submit to UI updated | ms | 1,406 (1,402–1,414) | 890 (884–893) | -516 (-36.7%) [-534, -509] | better |
| delete discussion: follow-up reads | requests | 1 | 1 | 0 | same |

## Stale views

| Metric | Unit | react-query | data-client + optimistic | Change | Verdict |
| --- | --- | --- | --- | --- | --- |
| back to list (shows rename?): stale (1 = yes) | median of runs | 1 | 0 | -1 (-100%) | better |
| reopen discussion (comment gone?): stale (1 = yes) | median of runs | 0 | 0 | 0 | same |
| dashboard (shows new name?): stale (1 = yes) | median of runs | 0 | 0 | 0 | same |
| list again: stale (1 = yes) | median of runs | 1 | 0 | -1 (-100%) | better |

## Bundle

| Metric | Unit | react-query | data-client + optimistic | Change | Verdict |
| --- | --- | --- | --- | --- | --- |
| Entry JS, gzip | kB | 178 | 162 | -16.1 (-9.1%) | better |
| Entry JS, brotli | kB | 153 | 139 | -14.4 (-9.4%) | better |
| Entry JS, raw | kB | 553 | 509 | -44.1 (-8%) | better |
| All JS, gzip | kB | 233 | 215 | -17.5 (-7.5%) | better |
| All JS, brotli | kB | 203 | 187 | -15.6 (-7.7%) | better |
| All JS, raw | kB | 702 | 654 | -48.0 (-6.8%) | better |
| CSS, gzip | kB | 7.68 | 7.68 | 0 | same |

## Code

| Metric | Unit | react-query | data-client + optimistic | Change | Verdict |
| --- | --- | --- | --- | --- | --- |
| app LoC | lines | 3,451 | 3,302 | -149 (-4.3%) | better |
| app files | files | 76 | 76 | 0 | same |
| app decision points | count | 97 | 82 | -15 (-15.5%) | better |
| test LoC | lines | 2,097 | 2,200 | +103 (+4.9%) | changed |
| test files | files | 40 | 42 | +2 (+5%) | changed |
| test decision points | count | 82 | 84 | +2 (+2.4%) | changed |
| data LoC | lines | 514 | 302 | -212 (-41.2%) | better |
| data files | files | 15 | 7 | -8 (-53.3%) | better |
| data decision points | count | 14 | 10 | -4 (-28.6%) | better |

## Plumbing

| Metric | Unit | react-query | data-client + optimistic | Change | Verdict |
| --- | --- | --- | --- | --- | --- |
| useEffect | count | 5 | 5 | 0 | same |
| useState | count | 4 | 4 | 0 | same |
| loadingFlags | count | 45 | 40 | -5 (-11.1%) | better |
| cacheCalls | count | 24 | 10 | -14 (-58.3%) | better |
| cacheKeys | count | 11 | 0 | -11 (-100%) | better |
| tryCatch | count | 0 | 2 | +2 | worse |
| files importing @tanstack/react-query | files | 19 | 0 | -19 (-100%) | changed |
| files importing react-query-auth | files | 1 | 0 | -1 (-100%) | changed |
| files importing @data-client/react | files | 0 | 19 | +19 | changed |
| files importing @data-client/rest | files | 0 | 5 | +5 | changed |
| files importing axios | files | 1 | 0 | -1 (-100%) | changed |

## Feature cost

| Metric | Unit | react-query | data-client + optimistic | Change | Verdict |
| --- | --- | --- | --- | --- | --- |
| Tokens, all (input + cache + output) | tokens | 779,816 (777,679–781,954) | 1,156,346 (1,045,666–1,267,026) | +376,530 (+48.3%) [+150,895, +602,165] | needs 3+ runs |
| Output tokens | tokens | 6,103 (5,610–6,597) | 11,660 (10,661–12,658) | +5,557 (+91%) [+2,573, +8,540] | needs 3+ runs |
| Cost | USD | 0.29 (0.28–0.3) | 0.42 (0.39–0.45) | +0.12 (+41.6%) [+0.04, +0.21] | needs 3+ runs |
| Agent turns | turns | 23 (22–24) | 38 (32.5–43.5) | +15 (+65.2%) [+2, +28] | needs 3+ runs |
| Wall time | ms | 92,328 (86,267–98,388) | 135,710 (122,566–148,853) | +43,382 (+47%) [+4,974, +81,790] | needs 3+ runs |
| Lines changed (excl. lockfiles) | lines | 40.5 (38.8–42.3) | 78 (76.5–79.5) | +37.5 (+92.6%) [+31, +44] | needs 3+ runs |
| Files changed | files | 8.5 (8.25–8.75) | 10.5 (10.3–10.8) | +2 (+23.5%) [+1, +3] | needs 3+ runs |
| Acceptance passed (1 = yes) | median of runs | 1 | 1 | 0 | same |
