# bulletproof-react: what optimistic updates add

- Flow: 8 interleaved runs per variant at 4x CPU throttle; 13 steps (6 mutations).
- Sampled rows show median (interquartile range); the change column adds a 95% bootstrap interval in brackets. "Within noise" means that interval includes zero.

## Setup

| Variant                  | Commit                                   | Uncommitted files |
| ------------------------ | ---------------------------------------- | ----------------- |
| data-client              | 9506629ed003a561c6627735480cce4994244bb4 | 58                |
| data-client + optimistic | fb6c863163fbfc202666d745d1596083ef374bc4 | 59                |

Config `../data-client/.agents/projects/migrations/bulletproof-react/impact/impact.config.mjs`, prep `fixed-latency.patch`, Node v22.23.4, Playwright 1.65.0.

## Flow

| Metric                                                    | Unit     | data-client         | data-client + optimistic | Change                           | Verdict |
| --------------------------------------------------------- | -------- | ------------------- | ------------------------ | -------------------------------- | ------- |
| Mutation submit to UI updated (sum)                       | ms       | 5,001 (4,973–5,018) | 1,888 (1,864–1,917)      | -3,113 (-62.3%) [-3,160, -3,054] | better  |
| Reads triggered by mutations                              | requests | 2                   | 2                        | 0                                | same    |
| Stale views (checked views showing old data)              | views    | 0                   | 0                        | 0                                | same    |
| All steps, action to ready (sum)                          | ms       | 7,777 (7,695–7,815) | 4,658 (4,603–4,709)      | -3,119 (-40.1%) [-3,212, -2,992] | better  |
| API requests                                              | requests | 10                  | 10                       | 0                                | same    |
| API reads (GET)                                           | requests | 4                   | 4                        | 0                                | same    |
| API writes                                                | requests | 6                   | 6                        | 0                                | same    |
| Redundant reads (same URL, same payload already received) | requests | 0                   | 0                        | 0                                | same    |
| Navigations with no loading indicator (of 7)              | navs     | 7                   | 7                        | 0                                | same    |
| Loading indicators shown                                  | count    | 0                   | 0                        | 0                                | same    |
| Loading indicator visible                                 | ms       | 0                   | 0                        | 0                                | same    |
| Long tasks (>50ms)                                        | count    | 0                   | 1                        | +1                               | worse   |
| Slowest interaction (input to next paint)                 | ms       | 36 (32–50)          | 76 (64–82)               | +40 (+111%) [+16, +52]           | worse   |
| Layout shift (CLS sum)                                    | score    | 0                   | 0                        | 0                                | worse   |
| Reads the redundancy check could not hash                 | requests | 0                   | 0                        | 0                                | same    |
| Total blocking time                                       | ms       | 0                   | 10 (4.5–17.8)            | +10 [+3.5, +20]                  | worse   |

## Cold load

| Metric                    | Unit | data-client         | data-client + optimistic | Change                       | Verdict      |
| ------------------------- | ---- | ------------------- | ------------------------ | ---------------------------- | ------------ |
| First screen ready        | ms   | 1,647 (1,624–1,661) | 1,675 (1,624–1,701)      | +28 (+1.7%) [-51, +80]       | within noise |
| Load event                | ms   | 414 (402–418)       | 415 (397–440)            | +1.5 (+0.4%) [-21, +35]      | within noise |
| Largest contentful paint  | ms   | 1,554 (1,511–1,562) | 1,544 (1,493–1,580)      | -10 (-0.6%) [-82, +68.0]     | within noise |
| JS parse + compile        | ms   | 499 (486–514)       | 522 (494–530)            | +22.8 (+4.6%) [-30.4, +44.6] | within noise |
| JS module evaluation      | ms   | 428 (418–451)       | 453 (418–480)            | +24.6 (+5.8%) [-25.9, +62.2] | within noise |
| Main-thread JS            | ms   | 723 (717–753)       | 754 (720–777)            | +31.3 (+4.3%) [-44.5, +61.8] | within noise |
| Total blocking time       | ms   | 321 (311–339)       | 332 (317–359)            | +11 (+3.4%) [-32, +48.5]     | within noise |
| Loading indicator visible | ms   | 0                   | 0                        | 0                            | same         |
| JS heap                   | MB   | 7.72 (7.71–7.73)    | 7.71 (7.7–7.73)          | -0.01 (-0.1%) [-0.03, +0.03] | within noise |

## Nav steps

| Metric                                             | Unit     | data-client    | data-client + optimistic | Change                       | Verdict      |
| -------------------------------------------------- | -------- | -------------- | ------------------------ | ---------------------------- | ------------ |
| open discussions: action to ready                  | ms       | 929 (913–959)  | 925 (917–951)            | -4.5 (-0.5%) [-39, +37.5]    | within noise |
| open discussions: reads                            | requests | 1              | 1                        | 0                            | same         |
| open discussion: action to ready                   | ms       | 931 (925–938)  | 915 (912–930)            | -16.5 (-1.8%) [-29.5, +15.5] | within noise |
| open discussion: reads                             | requests | 1              | 1                        | 0                            | same         |
| back to list (shows rename?): action to ready      | ms       | 96.5 (95.8–97) | 114 (100–115)            | +17.5 (+18.1%) [-2, +22.5]   | within noise |
| back to list (shows rename?): reads                | requests | 0              | 0                        | 0                            | same         |
| reopen discussion (comment gone?): action to ready | ms       | 92 (88.5–102)  | 94 (85.3–102)            | +2 (+2.2%) [-13.0, +21.0]    | within noise |
| reopen discussion (comment gone?): reads           | requests | 0              | 0                        | 0                            | same         |
| profile: action to ready                           | ms       | 521 (518–535)  | 516 (515–539)            | -4.5 (-0.9%) [-27, +22.5]    | within noise |
| profile: reads                                     | requests | 0              | 0                        | 0                            | same         |
| dashboard (shows new name?): action to ready       | ms       | 89 (82.3–101)  | 88 (79.8–92.3)           | -1 (-1.1%) [-17.5, +9.5]     | within noise |
| dashboard (shows new name?): reads                 | requests | 0              | 0                        | 0                            | same         |
| list again: action to ready                        | ms       | 93 (90.3–94.5) | 89.5 (85–90.3)           | -3.5 (-3.8%) [-10.5, +2]     | within noise |
| list again: reads                                  | requests | 0              | 0                        | 0                            | same         |

## Mutation steps

| Metric                                  | Unit     | data-client         | data-client + optimistic | Change                     | Verdict      |
| --------------------------------------- | -------- | ------------------- | ------------------------ | -------------------------- | ------------ |
| create discussion: submit to UI updated | ms       | 1,400 (1,392–1,405) | 1,395 (1,391–1,406)      | -5.5 (-0.4%) [-15.5, +19]  | within noise |
| create discussion: follow-up reads      | requests | 1                   | 1                        | 0                          | same         |
| update discussion: submit to UI updated | ms       | 894 (892–897)       | 101 (96.5–109)           | -793 (-88.7%) [-802, -781] | better       |
| update discussion: follow-up reads      | requests | 0                   | 0                        | 0                          | same         |
| create comment: submit to UI updated    | ms       | 878 (871–886)       | 128 (122–149)            | -750 (-85.4%) [-766, -719] | better       |
| create comment: follow-up reads         | requests | 0                   | 0                        | 0                          | same         |
| delete comment: submit to UI updated    | ms       | 874 (872–884)       | 85.5 (81.8–91.5)         | -789 (-90.2%) [-814, -773] | better       |
| delete comment: follow-up reads         | requests | 0                   | 0                        | 0                          | same         |
| update profile: submit to UI updated    | ms       | 877 (872–881)       | 95.5 (87–96.3)           | -781 (-89.1%) [-794, -775] | better       |
| update profile: follow-up reads         | requests | 0                   | 0                        | 0                          | same         |
| delete discussion: submit to UI updated | ms       | 69.5 (64.5–84.3)    | 73.5 (68.3–80.5)         | +4 (+5.8%) [-15, +18]      | within noise |
| delete discussion: follow-up reads      | requests | 1                   | 1                        | 0                          | same         |

## Stale views

| Metric                                             | Unit           | data-client | data-client + optimistic | Change | Verdict |
| -------------------------------------------------- | -------------- | ----------- | ------------------------ | ------ | ------- |
| back to list (shows rename?): stale (1 = yes)      | median of runs | 0           | 0                        | 0      | same    |
| reopen discussion (comment gone?): stale (1 = yes) | median of runs | 0           | 0                        | 0      | same    |
| dashboard (shows new name?): stale (1 = yes)       | median of runs | 0           | 0                        | 0      | same    |
| list again: stale (1 = yes)                        | median of runs | 0           | 0                        | 0      | same    |

## Bundle

| Metric           | Unit | data-client | data-client + optimistic | Change        | Verdict |
| ---------------- | ---- | ----------- | ------------------------ | ------------- | ------- |
| Entry JS, gzip   | kB   | 162         | 162                      | +0.05 (0%)    | worse   |
| Entry JS, brotli | kB   | 139         | 139                      | +0.05 (0%)    | worse   |
| Entry JS, raw    | kB   | 509         | 509                      | +0.13 (0%)    | worse   |
| All JS, gzip     | kB   | 215         | 215                      | +0.17 (+0.1%) | worse   |
| All JS, brotli   | kB   | 187         | 187                      | +0.11 (+0.1%) | worse   |
| All JS, raw      | kB   | 654         | 654                      | +0.52 (+0.1%) | worse   |
| CSS, gzip        | kB   | 7.68        | 7.68                     | 0             | same    |

## Code

| Metric               | Unit  | data-client | data-client + optimistic | Change      | Verdict |
| -------------------- | ----- | ----------- | ------------------------ | ----------- | ------- |
| app LoC              | lines | 3,302       | 3,302                    | 0           | same    |
| app files            | files | 76          | 76                       | 0           | same    |
| app decision points  | count | 82          | 82                       | 0           | same    |
| test LoC             | lines | 2,156       | 2,200                    | +44 (+2%)   | changed |
| test files           | files | 41          | 42                       | +1 (+2.4%)  | changed |
| test decision points | count | 84          | 84                       | 0           | same    |
| data LoC             | lines | 276         | 302                      | +26 (+9.4%) | worse   |
| data files           | files | 7           | 7                        | 0           | same    |
| data decision points | count | 7           | 10                       | +3 (+42.9%) | worse   |

## Plumbing

| Metric                                | Unit  | data-client | data-client + optimistic | Change | Verdict |
| ------------------------------------- | ----- | ----------- | ------------------------ | ------ | ------- |
| useEffect                             | count | 5           | 5                        | 0      | same    |
| useState                              | count | 4           | 4                        | 0      | same    |
| loadingFlags                          | count | 40          | 40                       | 0      | same    |
| cacheCalls                            | count | 10          | 10                       | 0      | same    |
| cacheKeys                             | count | 0           | 0                        | 0      | same    |
| tryCatch                              | count | 2           | 2                        | 0      | same    |
| files importing @tanstack/react-query | files | 0           | 0                        | 0      | same    |
| files importing react-query-auth      | files | 0           | 0                        | 0      | same    |
| files importing @data-client/react    | files | 19          | 19                       | 0      | same    |
| files importing @data-client/rest     | files | 5           | 5                        | 0      | same    |
| files importing axios                 | files | 0           | 0                        | 0      | same    |
