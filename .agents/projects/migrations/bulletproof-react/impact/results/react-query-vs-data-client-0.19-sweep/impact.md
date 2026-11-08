# bulletproof-react: react-query vs data-client 0.19 beta, latency sweep

- Flow: 8 interleaved runs per variant at 4x CPU throttle; 13 steps (6 mutations).
- Sampled rows show median (interquartile range); the change column adds a 95% bootstrap interval in brackets. "Within noise" means that interval includes zero.
- Speed is baseline time divided by migrated time: 1.2x means the migrated build is 20% faster, 0.8x means 20% slower. Rows within noise show ≈1x.
- Mock API latency: 400 ms for every table except the latency sweep, which repeats the flow at 100 ms, 400 ms, 1000 ms.

## Setup

| Variant | Data libraries | Commit | Uncommitted files | Working-tree diff sha1 |
| --- | --- | --- | --- | --- |
| react-query | @tanstack/react-query 5.32.1, react-query-auth 2.4.3, axios 1.6.8 | 9506629ed003a561c6627735480cce4994244bb4 | 3 | 8dfaf086b169 |
| data-client-0.19 | @data-client/react 0.19.0-beta-20261108175612-3ae266bf35a5a44fec04d951fc8503e0cb578dda, @data-client/rest 0.19.0-beta-20261108175612-3ae266bf35a5a44fec04d951fc8503e0cb578dda | fa3e4f090bb89eba13d823b12ec2be34ae72cf10 | 3 | ffd04de1330c |

Config `.agents/projects/migrations/bulletproof-react/impact/impact.config.mjs`, prep `fixed-latency.patch`, Node v22.23.4, Playwright 1.59.1.

## Flow

| Metric | Unit | react-query | data-client-0.19 | Change | Speed | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| Failed runs (left out) | runs | 0 | 0 | 0 |  | same |
| Mutation submit to UI updated (sum) | ms | 8,578 (8,504–8,599) | 1,984 (1,954–2,000) | -6,594 (-76.9%) [-6,642, -6,494] | 4.3x (333% faster) | better |
| Reads triggered by mutations | requests | 6 | 2 | -4 (-66.7%) |  | better |
| Stale views (checked views showing old data) | views | 2 | 0 | -2 (-100%) |  | better |
| All steps, action to ready (sum) | ms | 11,503 (11,471–11,568) | 4,871 (4,831–4,902) | -6,632 (-57.7%) [-6,750, -6,513] | 2.4x (136% faster) | better |
| API requests | requests | 15 | 10 | -5 (-33.3%) |  | better |
| API reads (GET) | requests | 9 | 4 | -5 (-55.6%) |  | better |
| API writes | requests | 6 | 6 | 0 |  | same |
| Redundant reads (same URL, same payload already received) | requests | 0 | 0 | 0 |  | same |
| Navigations with no loading indicator (of 7) | navs | 7 | 7 | 0 |  | same |
| Navigations served from cache, no reads (of 7) | navs | 5 | 5 | 0 |  | same |
| Loading indicators shown | count | 0 | 0 | 0 |  | same |
| Loading indicator visible | ms | 0 | 0 | 0 |  | same |
| Long tasks (>50ms) | count | 0 (0–0.25) | 1 (1–1.25) | +1 [+0.5, +2] |  | worse |
| Slowest interaction (input to next paint) | ms | 48 (48–50) | 80 (80–84) | +32 (+66.7%) [+24, +40] | 0.60x (40% slower) | worse |
| Layout shift (CLS sum) | score | 0 | 0 | 0 |  | same |
| Reads the redundancy check could not hash | requests | 0 | 0 | 0 |  | same |
| Total blocking time | ms | 0 | 17 (15–19) | +17 [+14, +22] |  | worse |

## Cold load

| Metric | Unit | react-query | data-client-0.19 | Change | Speed | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| First screen ready | ms | 1,735 (1,685–1,775) | 1,723 (1,707–1,791) | -12 (-0.7%) [-68.5, +130] | ≈1x | within noise |
| Load event | ms | 431 (401–464) | 453 (436–475) | +21.5 (+5%) [-24.0, +75.5] | ≈1x | within noise |
| Largest contentful paint | ms | 1,578 (1,523–1,598) | 1,576 (1,550–1,629) | -2 (-0.1%) [-48, +144] | ≈1x | within noise |
| JS parse + compile | ms | 516 (507–525) | 522 (499–555) | +5.25 (+1%) [-23.6, +90.3] | ≈1x | within noise |
| JS module evaluation | ms | 453 (437–471) | 472 (447–503) | +18.6 (+4.1%) [-31.6, +86.5] | ≈1x | within noise |
| Main-thread JS | ms | 777 (755–792) | 756 (745–811) | -21.1 (-2.7%) [-49.7, +89.1] | ≈1x | within noise |
| Total blocking time | ms | 329 (319–347) | 354 (341–387) | +25 (+7.6%) [-9.02, +95.1] |  | within noise |
| Loading indicator visible | ms | 549 (539–557) | 0 | -549 (-100%) [-562, -537] |  | better |
| JS heap | MB | 6.59 (6.58–6.6) | 6.41 (6.39–6.41) | -0.18 (-2.7%) [-0.2, -0.17] |  | better |

## Nav steps

| Metric | Unit | react-query | data-client-0.19 | Change | Speed | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| open discussions: action to ready | ms | 981 (971–991) | 961 (952–971) | -19.5 (-2%) [-51, +1.5] | ≈1x | within noise |
| open discussions: reads | requests | 1 | 1 | 0 |  | same |
| open discussion: action to ready | ms | 1,012 (978–1,044) | 1,006 (975–1,030) | -6 (-0.6%) [-65, +57] | ≈1x | within noise |
| open discussion: reads | requests | 2 | 1 | -1 (-50%) |  | better |
| back to list (shows rename?): action to ready | ms | 115 (106–126) | 126 (106–141) | +10.5 (+9.1%) [-18, +33] | ≈1x | within noise |
| back to list (shows rename?): reads | requests | 0 | 0 | 0 |  | same |
| reopen discussion (comment gone?): action to ready | ms | 114 (98.8–128) | 117 (107–122) | +3 (+2.6%) [-26, +23.5] | ≈1x | within noise |
| reopen discussion (comment gone?): reads | requests | 0 | 0 | 0 |  | same |
| profile: action to ready | ms | 495 (483–525) | 468 (448–501) | -26.5 (-5.4%) [-120, +15.0] | ≈1x | within noise |
| profile: reads | requests | 0 | 0 | 0 |  | same |
| dashboard (shows new name?): action to ready | ms | 96.5 (84.8–108) | 109 (96–124) | +12 (+12.4%) [-11, +35.5] | ≈1x | within noise |
| dashboard (shows new name?): reads | requests | 0 | 0 | 0 |  | same |
| list again: action to ready | ms | 105 (103–112) | 115 (103–129) | +10 (+9.5%) [-10, +29.5] | ≈1x | within noise |
| list again: reads | requests | 0 | 0 | 0 |  | same |

## Mutation steps

| Metric | Unit | react-query | data-client-0.19 | Change | Speed | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| create discussion: submit to UI updated | ms | 1,452 (1,441–1,457) | 1,418 (1,412–1,436) | -34.5 (-2.4%) [-45.5, 0] | ≈1x | within noise |
| create discussion: follow-up reads | requests | 1 | 1 | 0 |  | same |
| create discussion: slowest interaction | ms | 32 (24–32) | 32 (32–40) | 0 [0, +16] | ≈1x | within noise |
| update discussion: submit to UI updated | ms | 1,444 (1,422–1,446) | 108 (104–114) | -1,335 (-92.5%) [-1,344, -1,309] | 13.4x (1,237% faster) | better |
| update discussion: follow-up reads | requests | 1 | 0 | -1 (-100%) |  | better |
| update discussion: slowest interaction | ms | 32 | 48 (48–50) | +16 (+50%) [+16, +24] | 0.67x (33% slower) | worse |
| create comment: submit to UI updated | ms | 1,416 (1,414–1,427) | 151 (144–154) | -1,265 (-89.3%) [-1,287, -1,258] | 9.4x (838% faster) | better |
| create comment: follow-up reads | requests | 1 | 0 | -1 (-100%) |  | better |
| create comment: slowest interaction | ms | 32 | 80 (80–84) | +48 (+150%) [+48, +56.1] | 0.40x (60% slower) | worse |
| delete comment: submit to UI updated | ms | 1,414 (1,400–1,423) | 92 (89.8–97.3) | -1,322 (-93.5%) [-1,334, -1,300] | 15.4x (1,437% faster) | better |
| delete comment: follow-up reads | requests | 1 | 0 | -1 (-100%) |  | better |
| delete comment: slowest interaction | ms | 16 (0–16) | 40 (38–40) | +24 (+150%) [+20, +40] | 0.40x (60% slower) | worse |
| update profile: submit to UI updated | ms | 1,421 (1,411–1,439) | 106 (101–116) | -1,315 (-92.5%) [-1,337, -1,294] | 13.4x (1,241% faster) | better |
| update profile: follow-up reads | requests | 1 | 0 | -1 (-100%) |  | better |
| update profile: slowest interaction | ms | 32 (30–32) | 40 (40–42) | +8 (+25%) [+8, +16] | 0.80x (20% slower) | worse |
| delete discussion: submit to UI updated | ms | 1,418 (1,411–1,427) | 89 (85.8–92) | -1,329 (-93.7%) [-1,347, -1,317] | 15.9x (1,493% faster) | better |
| delete discussion: follow-up reads | requests | 1 | 1 | 0 |  | same |
| delete discussion: slowest interaction | ms | 16 | 32 (32–34) | +16 (+100%) [+16, +24] | 0.50x (50% slower) | worse |

## Stale views

| Metric | Unit | react-query | data-client-0.19 | Change | Verdict |
| --- | --- | --- | --- | --- | --- |
| back to list (shows rename?): stale (1 = yes) | median of runs | 1 | 0 | -1 (-100%) | better |
| reopen discussion (comment gone?): stale (1 = yes) | median of runs | 0 | 0 | 0 | same |
| dashboard (shows new name?): stale (1 = yes) | median of runs | 0 | 0 | 0 | same |
| list again: stale (1 = yes) | median of runs | 1 | 0 | -1 (-100%) | better |

## Bundle

| Metric | Unit | react-query | data-client-0.19 | Change | Verdict |
| --- | --- | --- | --- | --- | --- |
| Entry JS, gzip | kB | 155 | 152 | -2.64 (-1.7%) | better |
| Entry JS, brotli | kB | 133 | 131 | -2.43 (-1.8%) | better |
| Entry JS, raw | kB | 483 | 480 | -2.11 (-0.4%) | better |
| All JS, gzip | kB | 201 | 196 | -4.93 (-2.5%) | better |
| All JS, brotli | kB | 175 | 170 | -4.53 (-2.6%) | better |
| All JS, raw | kB | 607 | 599 | -8.32 (-1.4%) | better |
| CSS, gzip | kB | 7.75 | 7.74 | -0.01 (-0.1%) | better |

## Code

| Metric | Unit | react-query | data-client-0.19 | Change | Verdict |
| --- | --- | --- | --- | --- | --- |
| app LoC | lines | 3,451 | 3,482 | +31 (+0.9%) | worse |
| app files | files | 76 | 78 | +2 (+2.6%) | worse |
| app decision points | count | 97 | 90 | -7 (-7.2%) | better |
| test LoC | lines | 2,097 | 2,097 | 0 | same |
| test files | files | 40 | 40 | 0 | same |
| test decision points | count | 82 | 83 | +1 (+1.2%) | changed |
| data LoC | lines | 514 | 174 | -340 (-66.1%) | better |
| data files | files | 15 | 7 | -8 (-53.3%) | better |
| data decision points | count | 14 | 6 | -8 (-57.1%) | better |

## Plumbing

| Metric | Unit | react-query | data-client-0.19 | Change | Verdict |
| --- | --- | --- | --- | --- | --- |
| useEffect | count | 5 | 5 | 0 | same |
| useState | count | 4 | 4 | 0 | same |
| loadingFlags | count | 45 | 39 | -6 (-13.3%) | better |
| cacheCalls | count | 24 | 11 | -13 (-54.2%) | better |
| cacheKeys | count | 11 | 0 | -11 (-100%) | better |
| tryCatch | count | 0 | 2 | +2 | worse |
| files importing @tanstack/react-query | files | 19 | 0 | -19 (-100%) | changed |
| files importing react-query-auth | files | 1 | 0 | -1 (-100%) | changed |
| files importing @data-client/react | files | 0 | 19 | +19 | changed |
| files importing @data-client/rest | files | 0 | 3 | +3 | changed |
| files importing axios | files | 1 | 0 | -1 (-100%) | changed |

## Latency sweep

| Metric | Unit | react-query | data-client-0.19 | Change | Speed | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| Mutation submit to UI updated (sum), 100 ms latency | ms | 3,018 (2,959–3,151) | 1,496 (1,464–1,530) | -1,521 (-50.4%) [-1,936, -1,429] | 2.0x (102% faster) | better |
| All steps, action to ready (sum), 100 ms latency | ms | 4,786 (4,698–4,909) | 3,175 (3,150–3,261) | -1,611 (-33.7%) [-1,912, -1,380] | 1.51x (51% faster) | better |
| Slowest interaction (input to next paint), 100 ms latency | ms | 44 (40–50) | 84 (72–100) | +40 (+90.9%) [+20, +64] | 0.52x (48% slower) | worse |
| Mutation submit to UI updated (sum), 400 ms latency | ms | 8,578 (8,504–8,599) | 1,984 (1,954–2,000) | -6,594 (-76.9%) [-6,642, -6,494] | 4.3x (333% faster) | better |
| All steps, action to ready (sum), 400 ms latency | ms | 11,503 (11,471–11,568) | 4,871 (4,831–4,902) | -6,632 (-57.7%) [-6,750, -6,513] | 2.4x (136% faster) | better |
| Slowest interaction (input to next paint), 400 ms latency | ms | 48 (48–50) | 80 (80–84) | +32 (+66.7%) [+24, +40] | 0.60x (40% slower) | worse |
| Mutation submit to UI updated (sum), 1000 ms latency | ms | 14,573 (14,567–14,592) | 2,992 (2,962–3,030) | -11,581 (-79.5%) [-11,630, -11,531] | 4.9x (387% faster) | better |
| All steps, action to ready (sum), 1000 ms latency | ms | 18,523 (18,466–18,602) | 6,922 (6,886–6,963) | -11,601 (-62.6%) [-11,738, -11,499] | 2.7x (168% faster) | better |
| Slowest interaction (input to next paint), 1000 ms latency | ms | 48 (40–56) | 92 (76–112) | +44 (+91.7%) [+16, +72] | 0.52x (48% slower) | worse |
