# bulletproof-react: react-query vs data-client with optimistic updates

- Flow: 8 interleaved runs per variant at 4x CPU throttle; 13 steps (6 mutations).
- Sampled rows show median (interquartile range); the change column adds a 95% bootstrap interval in brackets. "Within noise" means that interval includes zero.

## Setup

| Variant                  | Commit                                   | Uncommitted files | Working-tree diff sha1 |
| ------------------------ | ---------------------------------------- | ----------------- | ---------------------- |
| react-query              | 9506629ed003a561c6627735480cce4994244bb4 | 5                 | –                      |
| data-client + optimistic | fb6c863163fbfc202666d745d1596083ef374bc4 | 59                | –                      |

Config `../data-client/.agents/projects/migrations/bulletproof-react/impact/impact.config.mjs`, prep `fixed-latency.patch`, Node v22.23.4, Playwright 1.65.0.

## Flow

| Metric                                                    | Unit     | react-query         | data-client + optimistic | Change                           | Verdict |
| --------------------------------------------------------- | -------- | ------------------- | ------------------------ | -------------------------------- | ------- |
| Mutation submit to UI updated (sum)                       | ms       | 7,056 (7,048–7,067) | 1,888 (1,869–1,910)      | -5,167 (-73.2%) [-5,196, -5,127] | better  |
| Reads triggered by mutations                              | requests | 6                   | 2                        | -4 (-66.7%)                      | better  |
| Stale views (checked views showing old data)              | views    | 2                   | 0                        | -2 (-100%)                       | better  |
| All steps, action to ready (sum)                          | ms       | 9,904 (9,858–9,915) | 4,671 (4,642–4,718)      | -5,233 (-52.8%) [-5,291, -5,141] | better  |
| API requests                                              | requests | 15                  | 10                       | -5 (-33.3%)                      | better  |
| API reads (GET)                                           | requests | 9                   | 4                        | -5 (-55.6%)                      | better  |
| API writes                                                | requests | 6                   | 6                        | 0                                | same    |
| Redundant reads (same URL, same payload already received) | requests | 0                   | 0                        | 0                                | same    |
| Navigations with no loading indicator (of 7)              | navs     | 7                   | 7                        | 0                                | same    |
| Loading indicators shown                                  | count    | 0                   | 0                        | 0                                | same    |
| Loading indicator visible                                 | ms       | 0                   | 0                        | 0                                | same    |
| Long tasks (>50ms)                                        | count    | 0                   | 1                        | +1                               | worse   |
| Slowest interaction (input to next paint)                 | ms       | 48 (46–56)          | 76 (64–96)               | +28 (+58.3%) [+12, +52]          | worse   |
| Layout shift (CLS sum)                                    | score    | 0                   | 0                        | 0                                | same    |
| Reads the redundancy check could not hash                 | requests | 0                   | 0                        | 0                                | same    |
| Total blocking time                                       | ms       | 0                   | 13.5 (3.5–32)            | +13.5 [+2, +32]                  | worse   |

## Cold load

| Metric                    | Unit | react-query         | data-client + optimistic | Change                       | Verdict      |
| ------------------------- | ---- | ------------------- | ------------------------ | ---------------------------- | ------------ |
| First screen ready        | ms   | 1,688 (1,624–1,730) | 1,654 (1,625–1,675)      | -34.5 (-2%) [-102, +67]      | within noise |
| Load event                | ms   | 450 (420–498)       | 398 (383–410)            | -52 (-11.6%) [-116, -9.45]   | better       |
| Largest contentful paint  | ms   | 1,612 (1,512–1,641) | 1,506 (1,502–1,550)      | -106 (-6.6%) [-140, +36]     | within noise |
| JS parse + compile        | ms   | 533 (509–547)       | 498 (486–522)            | -34.9 (-6.5%) [-68.8, +32.0] | within noise |
| JS module evaluation      | ms   | 487 (461–499)       | 440 (437–467)            | -47.2 (-9.7%) [-65, +9.26]   | within noise |
| Main-thread JS            | ms   | 800 (745–830)       | 732 (726–774)            | -68.5 (-8.6%) [-114, +28.0]  | within noise |
| Total blocking time       | ms   | 355 (319–376)       | 336 (324–364)            | -19 (-5.4%) [-60, +48]       | within noise |
| Loading indicator visible | ms   | 568 (557–570)       | 0                        | -568 (-100%) [-572, -550]    | better       |
| JS heap                   | MB   | 8.12 (8.11–8.13)    | 7.72 (7.71–7.72)         | -0.4 (-4.9%) [-0.42, -0.38]  | better       |

## Nav steps

| Metric                                             | Unit     | react-query     | data-client + optimistic | Change                    | Verdict      |
| -------------------------------------------------- | -------- | --------------- | ------------------------ | ------------------------- | ------------ |
| open discussions: action to ready                  | ms       | 923 (908–926)   | 914 (904–917)            | -9.5 (-1%) [-21.5, +8]    | within noise |
| open discussions: reads                            | requests | 1               | 1                        | 0                         | same         |
| open discussion: action to ready                   | ms       | 948 (939–959)   | 925 (916–955)            | -23 (-2.4%) [-42, +21]    | within noise |
| open discussion: reads                             | requests | 2               | 1                        | -1 (-50%)                 | better       |
| back to list (shows rename?): action to ready      | ms       | 125 (113–134)   | 107 (96.8–115)           | -18 (-14.5%) [-37, +7]    | within noise |
| back to list (shows rename?): reads                | requests | 0               | 0                        | 0                         | same         |
| reopen discussion (comment gone?): action to ready | ms       | 111 (90.3–127)  | 96.5 (93.8–100)          | -14.5 (-13.1%) [-35, +10] | within noise |
| reopen discussion (comment gone?): reads           | requests | 0               | 0                        | 0                         | same         |
| profile: action to ready                           | ms       | 541 (533–548)   | 528 (517–537)            | -12.5 (-2.3%) [-30.5, +2] | within noise |
| profile: reads                                     | requests | 0               | 0                        | 0                         | same         |
| dashboard (shows new name?): action to ready       | ms       | 90 (88.8–92.5)  | 89.5 (84–95.5)           | -0.5 (-0.6%) [-10, +7.5]  | within noise |
| dashboard (shows new name?): reads                 | requests | 0               | 0                        | 0                         | same         |
| list again: action to ready                        | ms       | 96.5 (94.5–100) | 93 (83.8–103)            | -3.5 (-3.6%) [-16, +12.5] | within noise |
| list again: reads                                  | requests | 0               | 0                        | 0                         | same         |

## Mutation steps

| Metric                                  | Unit     | react-query         | data-client + optimistic | Change                           | Verdict      |
| --------------------------------------- | -------- | ------------------- | ------------------------ | -------------------------------- | ------------ |
| create discussion: submit to UI updated | ms       | 1,402 (1,398–1,411) | 1,400 (1,394–1,404)      | -2.5 (-0.2%) [-16, +10]          | within noise |
| create discussion: follow-up reads      | requests | 1                   | 1                        | 0                                | same         |
| update discussion: submit to UI updated | ms       | 1,397 (1,391–1,400) | 112 (104–118)            | -1,285 (-92%) [-1,298, -1,273]   | better       |
| update discussion: follow-up reads      | requests | 1                   | 0                        | -1 (-100%)                       | better       |
| create comment: submit to UI updated    | ms       | 1,392 (1,378–1,402) | 130 (116–142)            | -1,261 (-90.7%) [-1,285, -1,235] | better       |
| create comment: follow-up reads         | requests | 1                   | 0                        | -1 (-100%)                       | better       |
| delete comment: submit to UI updated    | ms       | 1,397 (1,387–1,404) | 83.5 (79.8–87.3)         | -1,313 (-94%) [-1,324, -1,300]   | better       |
| delete comment: follow-up reads         | requests | 1                   | 0                        | -1 (-100%)                       | better       |
| update profile: submit to UI updated    | ms       | 1,389 (1,384–1,392) | 92 (88.5–99)             | -1,296 (-93.4%) [-1,303, -1,282] | better       |
| update profile: follow-up reads         | requests | 1                   | 0                        | -1 (-100%)                       | better       |
| delete discussion: submit to UI updated | ms       | 83 (76–91)          | 75 (66.5–80)             | -8 (-9.6%) [-22.5, +5]           | within noise |
| delete discussion: follow-up reads      | requests | 1                   | 1                        | 0                                | same         |

## Stale views

| Metric                                             | Unit           | react-query | data-client + optimistic | Change     | Verdict |
| -------------------------------------------------- | -------------- | ----------- | ------------------------ | ---------- | ------- |
| back to list (shows rename?): stale (1 = yes)      | median of runs | 1           | 0                        | -1 (-100%) | better  |
| reopen discussion (comment gone?): stale (1 = yes) | median of runs | 0           | 0                        | 0          | same    |
| dashboard (shows new name?): stale (1 = yes)       | median of runs | 0           | 0                        | 0          | same    |
| list again: stale (1 = yes)                        | median of runs | 1           | 0                        | -1 (-100%) | better  |

## Bundle

| Metric           | Unit | react-query | data-client + optimistic | Change        | Verdict |
| ---------------- | ---- | ----------- | ------------------------ | ------------- | ------- |
| Entry JS, gzip   | kB   | 178         | 162                      | -16.1 (-9.1%) | better  |
| Entry JS, brotli | kB   | 153         | 139                      | -14.4 (-9.4%) | better  |
| Entry JS, raw    | kB   | 553         | 509                      | -44.1 (-8%)   | better  |
| All JS, gzip     | kB   | 233         | 215                      | -17.5 (-7.5%) | better  |
| All JS, brotli   | kB   | 203         | 187                      | -15.6 (-7.7%) | better  |
| All JS, raw      | kB   | 702         | 654                      | -48.0 (-6.8%) | better  |
| CSS, gzip        | kB   | 7.68        | 7.68                     | 0             | same    |

## Code

| Metric               | Unit  | react-query | data-client + optimistic | Change        | Verdict |
| -------------------- | ----- | ----------- | ------------------------ | ------------- | ------- |
| app LoC              | lines | 3,451       | 3,302                    | -149 (-4.3%)  | better  |
| app files            | files | 76          | 76                       | 0             | same    |
| app decision points  | count | 97          | 82                       | -15 (-15.5%)  | better  |
| test LoC             | lines | 2,097       | 2,200                    | +103 (+4.9%)  | changed |
| test files           | files | 40          | 42                       | +2 (+5%)      | changed |
| test decision points | count | 82          | 84                       | +2 (+2.4%)    | changed |
| data LoC             | lines | 514         | 302                      | -212 (-41.2%) | better  |
| data files           | files | 15          | 7                        | -8 (-53.3%)   | better  |
| data decision points | count | 14          | 10                       | -4 (-28.6%)   | better  |

## Plumbing

| Metric                                | Unit  | react-query | data-client + optimistic | Change       | Verdict |
| ------------------------------------- | ----- | ----------- | ------------------------ | ------------ | ------- |
| useEffect                             | count | 5           | 5                        | 0            | same    |
| useState                              | count | 4           | 4                        | 0            | same    |
| loadingFlags                          | count | 45          | 40                       | -5 (-11.1%)  | better  |
| cacheCalls                            | count | 24          | 10                       | -14 (-58.3%) | better  |
| cacheKeys                             | count | 11          | 0                        | -11 (-100%)  | better  |
| tryCatch                              | count | 0           | 2                        | +2           | worse   |
| files importing @tanstack/react-query | files | 19          | 0                        | -19 (-100%)  | changed |
| files importing react-query-auth      | files | 1           | 0                        | -1 (-100%)   | changed |
| files importing @data-client/react    | files | 0           | 19                       | +19          | changed |
| files importing @data-client/rest     | files | 0           | 5                        | +5           | changed |
| files importing axios                 | files | 1           | 0                        | -1 (-100%)   | changed |
