# bulletproof-react: react-query vs data-client

- Flow: 8 interleaved runs per variant at 4x CPU throttle; 13 steps (6 mutations).
- Sampled rows show median (interquartile range); the change column adds a 95% bootstrap interval in brackets. "Within noise" means that interval includes zero.

## Setup

| Variant     | Data libraries                                                      | Commit                                   | Uncommitted files | Working-tree diff sha1 |
| ----------- | ------------------------------------------------------------------- | ---------------------------------------- | ----------------- | ---------------------- |
| react-query | @tanstack/react-query 5.107.1, react-query-auth 2.4.3, axios 1.21.0 | 9506629ed003a561c6627735480cce4994244bb4 | 5                 | b331326d588c           |
| data-client | @data-client/react 0.18.2, @data-client/rest 0.18.2                 | 9506629ed003a561c6627735480cce4994244bb4 | 58                | 2e22615c1c3f           |

Config `../data-client/.agents/projects/migrations/bulletproof-react/impact/impact.config.mjs`, prep `fixed-latency.patch`, Node v22.23.4, Playwright 1.65.0.

## Flow

| Metric                                                    | Unit     | react-query            | data-client         | Change                           | Verdict      |
| --------------------------------------------------------- | -------- | ---------------------- | ------------------- | -------------------------------- | ------------ |
| Failed runs (left out)                                    | runs     | 0                      | 0                   | 0                                | same         |
| Mutation submit to UI updated (sum)                       | ms       | 8,431 (8,414–8,476)    | 5,887 (5,871–5,909) | -2,544 (-30.2%) [-2,601, -2,486] | better       |
| Reads triggered by mutations                              | requests | 6                      | 2                   | -4 (-66.7%)                      | better       |
| Stale views (checked views showing old data)              | views    | 2                      | 0                   | -2 (-100%)                       | better       |
| All steps, action to ready (sum)                          | ms       | 11,323 (11,249–11,340) | 8,722 (8,703–8,748) | -2,601 (-23%) [-2,639, -2,501]   | better       |
| API requests                                              | requests | 15                     | 10                  | -5 (-33.3%)                      | better       |
| API reads (GET)                                           | requests | 9                      | 4                   | -5 (-55.6%)                      | better       |
| API writes                                                | requests | 6                      | 6                   | 0                                | same         |
| Redundant reads (same URL, same payload already received) | requests | 0                      | 0                   | 0                                | same         |
| Navigations with no loading indicator (of 7)              | navs     | 7                      | 7                   | 0                                | same         |
| Loading indicators shown                                  | count    | 0                      | 0                   | 0                                | same         |
| Loading indicator visible                                 | ms       | 0                      | 0                   | 0                                | same         |
| Long tasks (>50ms)                                        | count    | 1 (0–1)                | 0                   | -1 (-100%) [-1, 0]               | within noise |
| Slowest interaction (input to next paint)                 | ms       | 52 (40–56)             | 48 (48–56)          | -4 (-7.7%) [-8, +12]             | within noise |
| Layout shift (CLS sum)                                    | score    | 0                      | 0                   | 0                                | same         |
| Reads the redundancy check could not hash                 | requests | 0                      | 0                   | 0                                | same         |
| Total blocking time                                       | ms       | 1 (0–3.75)             | 0                   | -1 (-100%) [-6, 0]               | within noise |

## Cold load

| Metric                    | Unit | react-query         | data-client         | Change                      | Verdict      |
| ------------------------- | ---- | ------------------- | ------------------- | --------------------------- | ------------ |
| First screen ready        | ms   | 1,720 (1,690–1,831) | 1,700 (1,647–1,739) | -20.5 (-1.2%) [-216, +61]   | within noise |
| Load event                | ms   | 458 (442–479)       | 408 (384–445)       | -49.5 (-10.8%) [-117, +17]  | within noise |
| Largest contentful paint  | ms   | 1,674 (1,624–1,789) | 1,626 (1,545–1,668) | -48 (-2.9%) [-238, +40]     | within noise |
| JS parse + compile        | ms   | 569 (532–613)       | 550 (533–569)       | -19.4 (-3.4%) [-112, +37.0] | within noise |
| JS module evaluation      | ms   | 480 (476–533)       | 478 (458–501)       | -1.51 (-0.3%) [-122, +33.0] | within noise |
| Main-thread JS            | ms   | 870 (823–937)       | 812 (800–841)       | -57.6 (-6.6%) [-186, +23.4] | within noise |
| Total blocking time       | ms   | 378 (353–421)       | 402 (361–414)       | +24.5 (+6.5%) [-102, +65.5] | within noise |
| Loading indicator visible | ms   | 588 (580–606)       | 0                   | -588 (-100%) [-607, -580]   | better       |
| JS heap                   | MB   | 8.11 (8.1–8.12)     | 7.71 (7.71–7.72)    | -0.4 (-4.9%) [-0.42, -0.39] | better       |

## Nav steps

| Metric                                             | Unit     | react-query    | data-client      | Change                    | Verdict      |
| -------------------------------------------------- | -------- | -------------- | ---------------- | ------------------------- | ------------ |
| open discussions: action to ready                  | ms       | 925 (918–932)  | 935 (917–941)    | +10 (+1.1%) [-15, +24]    | within noise |
| open discussions: reads                            | requests | 1              | 1                | 0                         | same         |
| open discussion: action to ready                   | ms       | 950 (945–961)  | 937 (922–955)    | -13 (-1.4%) [-38, +16]    | within noise |
| open discussion: reads                             | requests | 2              | 1                | -1 (-50%)                 | better       |
| back to list (shows rename?): action to ready      | ms       | 116 (109–127)  | 111 (105–119)    | -5 (-4.3%) [-33.5, +12.5] | within noise |
| back to list (shows rename?): reads                | requests | 0              | 0                | 0                         | same         |
| reopen discussion (comment gone?): action to ready | ms       | 102 (93.5–126) | 103 (91.8–115)   | +1.5 (+1.5%) [-36.5, +32] | within noise |
| reopen discussion (comment gone?): reads           | requests | 0              | 0                | 0                         | same         |
| profile: action to ready                           | ms       | 545 (538–564)  | 540 (526–545)    | -5 (-0.9%) [-32, +15]     | within noise |
| profile: reads                                     | requests | 0              | 0                | 0                         | same         |
| dashboard (shows new name?): action to ready       | ms       | 95 (87–103)    | 89.5 (85.5–92.8) | -5.5 (-5.8%) [-18, +6.5]  | within noise |
| dashboard (shows new name?): reads                 | requests | 0              | 0                | 0                         | same         |
| list again: action to ready                        | ms       | 105 (101–109)  | 107 (97–112)     | +2 (+1.9%) [-13, +12]     | within noise |
| list again: reads                                  | requests | 0              | 0                | 0                         | same         |

## Mutation steps

| Metric                                  | Unit     | react-query         | data-client         | Change                     | Verdict      |
| --------------------------------------- | -------- | ------------------- | ------------------- | -------------------------- | ------------ |
| create discussion: submit to UI updated | ms       | 1,412 (1,404–1,425) | 1,421 (1,411–1,424) | +9 (+0.6%) [-12.5, +21.5]  | within noise |
| create discussion: follow-up reads      | requests | 1                   | 1                   | 0                          | same         |
| update discussion: submit to UI updated | ms       | 1,409 (1,404–1,421) | 899 (892–902)       | -510 (-36.2%) [-529, -501] | better       |
| update discussion: follow-up reads      | requests | 1                   | 0                   | -1 (-100%)                 | better       |
| create comment: submit to UI updated    | ms       | 1,407 (1,388–1,414) | 888 (880–897)       | -519 (-36.9%) [-535, -485] | better       |
| create comment: follow-up reads         | requests | 1                   | 0                   | -1 (-100%)                 | better       |
| delete comment: submit to UI updated    | ms       | 1,401 (1,391–1,410) | 892 (886–894)       | -510 (-36.4%) [-525, -498] | better       |
| delete comment: follow-up reads         | requests | 1                   | 0                   | -1 (-100%)                 | better       |
| update profile: submit to UI updated    | ms       | 1,399 (1,395–1,408) | 904 (882–923)       | -495 (-35.4%) [-523, -468] | better       |
| update profile: follow-up reads         | requests | 1                   | 0                   | -1 (-100%)                 | better       |
| delete discussion: submit to UI updated | ms       | 1,406 (1,403–1,413) | 897 (892–901)       | -510 (-36.2%) [-521, -499] | better       |
| delete discussion: follow-up reads      | requests | 1                   | 1                   | 0                          | same         |

## Stale views

| Metric                                             | Unit           | react-query | data-client | Change     | Verdict |
| -------------------------------------------------- | -------------- | ----------- | ----------- | ---------- | ------- |
| back to list (shows rename?): stale (1 = yes)      | median of runs | 1           | 0           | -1 (-100%) | better  |
| reopen discussion (comment gone?): stale (1 = yes) | median of runs | 0           | 0           | 0          | same    |
| dashboard (shows new name?): stale (1 = yes)       | median of runs | 0           | 0           | 0          | same    |
| list again: stale (1 = yes)                        | median of runs | 1           | 0           | -1 (-100%) | better  |

## Bundle

| Metric           | Unit | react-query | data-client | Change        | Verdict |
| ---------------- | ---- | ----------- | ----------- | ------------- | ------- |
| Entry JS, gzip   | kB   | 178         | 162         | -16.2 (-9.1%) | better  |
| Entry JS, brotli | kB   | 153         | 139         | -14.4 (-9.4%) | better  |
| Entry JS, raw    | kB   | 553         | 509         | -44.2 (-8%)   | better  |
| All JS, gzip     | kB   | 233         | 215         | -17.7 (-7.6%) | better  |
| All JS, brotli   | kB   | 203         | 187         | -15.7 (-7.7%) | better  |
| All JS, raw      | kB   | 702         | 654         | -48.5 (-6.9%) | better  |
| CSS, gzip        | kB   | 7.68        | 7.68        | 0             | same    |

## Code

| Metric               | Unit  | react-query | data-client | Change        | Verdict |
| -------------------- | ----- | ----------- | ----------- | ------------- | ------- |
| app LoC              | lines | 3,451       | 3,302       | -149 (-4.3%)  | better  |
| app files            | files | 76          | 76          | 0             | same    |
| app decision points  | count | 97          | 82          | -15 (-15.5%)  | better  |
| test LoC             | lines | 2,097       | 2,156       | +59 (+2.8%)   | changed |
| test files           | files | 40          | 41          | +1 (+2.5%)    | changed |
| test decision points | count | 82          | 84          | +2 (+2.4%)    | changed |
| data LoC             | lines | 514         | 276         | -238 (-46.3%) | better  |
| data files           | files | 15          | 7           | -8 (-53.3%)   | better  |
| data decision points | count | 14          | 7           | -7 (-50%)     | better  |

## Plumbing

| Metric                                | Unit  | react-query | data-client | Change       | Verdict |
| ------------------------------------- | ----- | ----------- | ----------- | ------------ | ------- |
| useEffect                             | count | 5           | 5           | 0            | same    |
| useState                              | count | 4           | 4           | 0            | same    |
| loadingFlags                          | count | 45          | 40          | -5 (-11.1%)  | better  |
| cacheCalls                            | count | 24          | 10          | -14 (-58.3%) | better  |
| cacheKeys                             | count | 11          | 0           | -11 (-100%)  | better  |
| tryCatch                              | count | 0           | 2           | +2           | worse   |
| files importing @tanstack/react-query | files | 19          | 0           | -19 (-100%)  | changed |
| files importing react-query-auth      | files | 1           | 0           | -1 (-100%)   | changed |
| files importing @data-client/react    | files | 0           | 19          | +19          | changed |
| files importing @data-client/rest     | files | 0           | 5           | +5           | changed |
| files importing axios                 | files | 1           | 0           | -1 (-100%)   | changed |
