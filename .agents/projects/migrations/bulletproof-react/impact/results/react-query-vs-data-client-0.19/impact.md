# bulletproof-react: react-query vs data-client 0.19 beta

- Flow: 8 interleaved runs per variant at 4x CPU throttle; 13 steps (6 mutations).
- Sampled rows show median (interquartile range); the change column adds a 95% bootstrap interval in brackets. "Within noise" means that interval includes zero.
- Speed is baseline time divided by migrated time: 1.2x means the migrated build is 20% faster, 0.8x means 20% slower. Rows within noise show ≈1x.
- Mock API latency: 400 ms.

## Setup

| Variant | Data libraries | Commit | Uncommitted files | Working-tree diff sha1 |
| --- | --- | --- | --- | --- |
| react-query | @tanstack/react-query 5.107.1, react-query-auth 2.4.3, axios 1.21.0 | 18d155d32fc4d64c70cd4a615b3d8c6036aa32e5 | 2 | 4a30f62ba7ca |
| data-client-0.19 | @data-client/react 0.19.0-beta-20261108175612-3ae266bf35a5a44fec04d951fc8503e0cb578dda, @data-client/rest 0.19.0-beta-20261108175612-3ae266bf35a5a44fec04d951fc8503e0cb578dda | 9c8de5ae22d76d07164780f8426fa90b718c50d2 | 2 | 4a30f62ba7ca |

Config `kit/.agents/projects/migrations/bulletproof-react/impact/impact.config.mjs`, prep `fixed-latency.patch`, Node v22.23.4, Playwright 1.65.0.

## Flow

| Metric | Unit | react-query | data-client-0.19 | Change | Speed | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| Failed runs (left out) | runs | 0 | 0 | 0 |  | same |
| Mutation submit to UI updated (sum) | ms | 8,516 (8,501–8,550) | 2,014 (1,981–2,038) | -6,502 (-76.4%) [-6,563, -6,459] | 4.2x (323% faster) | better |
| Reads triggered by mutations | requests | 6 | 2 | -4 (-66.7%) |  | better |
| Stale views (checked views showing old data) | views | 2 | 0 | -2 (-100%) |  | better |
| All steps, action to ready (sum) | ms | 11,492 (11,411–11,561) | 4,959 (4,928–4,996) | -6,532 (-56.8%) [-6,645, -6,409] | 2.3x (132% faster) | better |
| API requests | requests | 15 | 10 | -5 (-33.3%) |  | better |
| API reads (GET) | requests | 9 | 4 | -5 (-55.6%) |  | better |
| API writes | requests | 6 | 6 | 0 |  | same |
| Redundant reads (same URL, same payload already received) | requests | 0 | 0 | 0 |  | same |
| Navigations with no loading indicator (of 7) | navs | 7 | 7 | 0 |  | same |
| Navigations served from cache, no reads (of 7) | navs | 5 | 5 | 0 |  | same |
| Loading indicators shown | count | 0 | 0 | 0 |  | same |
| Loading indicator visible | ms | 0 | 0 | 0 |  | same |
| Long tasks (>50ms) | count | 0.5 (0–1.25) | 1 (1–2) | +0.5 (+100%) [-0.5, +2] |  | within noise |
| Slowest interaction (input to next paint) | ms | 56 (54–58) | 92 (80–106) | +36 (+64.3%) [+23.9, +52] | 0.61x (39% slower) | worse |
| Layout shift (CLS sum) | score | 0 | 0 | 0 |  | same |
| Reads the redundancy check could not hash | requests | 0 | 0 | 0 |  | same |
| Total blocking time | ms | 1 (0–2.25) | 22 (8.5–32.3) | +21 (+2,100%) [+6, +42.5] |  | worse |

## Cold load

| Metric | Unit | react-query | data-client-0.19 | Change | Speed | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| First screen ready | ms | 1,801 (1,771–1,858) | 1,818 (1,797–1,851) | +16.5 (+0.9%) [-141, +81] | ≈1x | within noise |
| Load event | ms | 478 (469–536) | 462 (429–487) | -16.5 (-3.5%) [-103, +20] | ≈1x | within noise |
| Largest contentful paint | ms | 1,752 (1,683–1,857) | 1,736 (1,697–1,757) | -16 (-0.9%) [-204, +72] | ≈1x | within noise |
| JS parse + compile | ms | 622 (577–665) | 633 (589–663) | +10.8 (+1.7%) [-74.6, +81.1] | ≈1x | within noise |
| JS module evaluation | ms | 544 (502–570) | 558 (544–567) | +14.2 (+2.6%) [-52, +66.3] | ≈1x | within noise |
| Main-thread JS | ms | 947 (883–1,021) | 923 (881–962) | -24.7 (-2.6%) [-165, +85.1] | ≈1x | within noise |
| Total blocking time | ms | 423 (400–478) | 458 (440–493) | +35 (+8.3%) [-83, +94.5] |  | within noise |
| Loading indicator visible | ms | 616 (597–631) | 0 | -616 (-100%) [-653, -573] |  | better |
| JS heap | MB | 8.12 (8.11–8.12) | 7.8 (7.8–7.82) | -0.32 (-3.9%) [-0.32, -0.29] |  | better |

## Nav steps

| Metric | Unit | react-query | data-client-0.19 | Change | Speed | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| open discussions: action to ready | ms | 966 (933–986) | 962 (953–972) | -4.5 (-0.5%) [-33, +36.5] | ≈1x | within noise |
| open discussions: reads | requests | 1 | 1 | 0 |  | same |
| open discussion: action to ready | ms | 964 (960–994) | 961 (949–975) | -3.5 (-0.4%) [-74.5, +18] | ≈1x | within noise |
| open discussion: reads | requests | 2 | 1 | -1 (-50%) |  | better |
| back to list (shows rename?): action to ready | ms | 128 (126–159) | 125 (110–151) | -2.5 (-2%) [-47.5, +35] | ≈1x | within noise |
| back to list (shows rename?): reads | requests | 0 | 0 | 0 |  | same |
| reopen discussion (comment gone?): action to ready | ms | 131 (120–143) | 124 (111–137) | -6.5 (-5%) [-37, +18.5] | ≈1x | within noise |
| reopen discussion (comment gone?): reads | requests | 0 | 0 | 0 |  | same |
| profile: action to ready | ms | 554 (483–567) | 555 (547–574) | +0.5 (+0.1%) [-20, +110] | ≈1x | within noise |
| profile: reads | requests | 0 | 0 | 0 |  | same |
| dashboard (shows new name?): action to ready | ms | 101 (98.3–109) | 94 (91.5–104) | -6.5 (-6.5%) [-18, +13] | ≈1x | within noise |
| dashboard (shows new name?): reads | requests | 0 | 0 | 0 |  | same |
| list again: action to ready | ms | 111 (99.8–127) | 110 (107–124) | -1.5 (-1.4%) [-19.5, +29.5] | ≈1x | within noise |
| list again: reads | requests | 0 | 0 | 0 |  | same |

## Mutation steps

| Metric | Unit | react-query | data-client-0.19 | Change | Speed | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| create discussion: submit to UI updated | ms | 1,430 (1,422–1,441) | 1,418 (1,407–1,432) | -12 (-0.8%) [-42.5, +9] | ≈1x | within noise |
| create discussion: follow-up reads | requests | 1 | 1 | 0 |  | same |
| create discussion: slowest interaction | ms | 32 (32–40) | 40 (38–48) | +8 (+25%) [-4, +16] | ≈1x | within noise |
| update discussion: submit to UI updated | ms | 1,417 (1,410–1,426) | 119 (113–128) | -1,297 (-91.6%) [-1,315, -1,279] | 11.9x (1,090% faster) | better |
| update discussion: follow-up reads | requests | 1 | 0 | -1 (-100%) |  | better |
| update discussion: slowest interaction | ms | 28 (24–32) | 56 (54–68) | +28 (+100%) [+20, +48] | 0.50x (50% slower) | worse |
| create comment: submit to UI updated | ms | 1,403 (1,399–1,405) | 152 (144–170) | -1,251 (-89.2%) [-1,262, -1,230] | 9.2x (823% faster) | better |
| create comment: follow-up reads | requests | 1 | 0 | -1 (-100%) |  | better |
| create comment: slowest interaction | ms | 32 | 84 (76–106) | +52 (+163%) [+39.8, +76] | 0.38x (62% slower) | worse |
| delete comment: submit to UI updated | ms | 1,414 (1,404–1,431) | 102 (92.5–112) | -1,311 (-92.8%) [-1,336, -1,293] | 13.9x (1,286% faster) | better |
| delete comment: follow-up reads | requests | 1 | 0 | -1 (-100%) |  | better |
| delete comment: slowest interaction | ms | 16 (12–18) | 44 (38–50) | +28 (+175%) [+16, +40] | 0.36x (64% slower) | worse |
| update profile: submit to UI updated | ms | 1,417 (1,408–1,427) | 127 (97–131) | -1,289 (-91%) [-1,329, -1,277] | 11.2x (1,015% faster) | better |
| update profile: follow-up reads | requests | 1 | 0 | -1 (-100%) |  | better |
| update profile: slowest interaction | ms | 32 (32–34) | 48 (40–56) | +16 (+50%) [+4, +24] | 0.67x (33% slower) | worse |
| delete discussion: submit to UI updated | ms | 1,422 (1,413–1,436) | 87 (82.8–106) | -1,334 (-93.9%) [-1,355, -1,309] | 16.3x (1,534% faster) | better |
| delete discussion: follow-up reads | requests | 1 | 1 | 0 |  | same |
| delete discussion: slowest interaction | ms | 16 (12–16) | 40 (32–42) | +24 (+150%) [+16, +36] | 0.40x (60% slower) | worse |

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
| Entry JS, gzip | kB | 178 | 163 | -14.8 (-8.3%) | better |
| Entry JS, brotli | kB | 153 | 140 | -13.2 (-8.6%) | better |
| Entry JS, raw | kB | 553 | 513 | -40.1 (-7.2%) | better |
| All JS, gzip | kB | 233 | 215 | -17.2 (-7.4%) | better |
| All JS, brotli | kB | 203 | 187 | -15.3 (-7.6%) | better |
| All JS, raw | kB | 702 | 656 | -46.8 (-6.7%) | better |
| CSS, gzip | kB | 7.68 | 7.68 | 0 | same |

## Code

| Metric | Unit | react-query | data-client-0.19 | Change | Verdict |
| --- | --- | --- | --- | --- | --- |
| app LoC | lines | 3,451 | 3,482 | +31 (+0.9%) | worse |
| app files | files | 76 | 78 | +2 (+2.6%) | worse |
| app decision points | count | 97 | 90 | -7 (-7.2%) | better |
| test LoC | lines | 2,174 | 2,174 | 0 | same |
| test files | files | 42 | 42 | 0 | same |
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
