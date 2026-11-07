# bulletproof-react: what optimistic updates add

- Flow: 8 interleaved runs per variant at 4x CPU throttle; 13 steps (6 mutations).
- Sampled rows show median (interquartile range); the change column adds a 95% bootstrap interval in brackets. "Within noise" means that interval includes zero.

## Setup

| Variant                  | Data libraries                                      | Commit                                   | Uncommitted files | Working-tree diff sha1 |
| ------------------------ | --------------------------------------------------- | ---------------------------------------- | ----------------- | ---------------------- |
| data-client              | @data-client/react 0.18.2, @data-client/rest 0.18.2 | 9506629ed003a561c6627735480cce4994244bb4 | 58                | 2e22615c1c3f           |
| data-client + optimistic | @data-client/react 0.18.2, @data-client/rest 0.18.2 | fb6c863163fbfc202666d745d1596083ef374bc4 | 59                | 5f2c80fa6a7d           |

Config `../data-client/.agents/projects/migrations/bulletproof-react/impact/impact.config.mjs`, prep `fixed-latency.patch`, Node v22.23.4, Playwright 1.65.0.

## Flow

| Metric                                                    | Unit     | data-client         | data-client + optimistic | Change                           | Verdict |
| --------------------------------------------------------- | -------- | ------------------- | ------------------------ | -------------------------------- | ------- |
| Failed runs (left out)                                    | runs     | 0                   | 0                        | 0                                | same    |
| Mutation submit to UI updated (sum)                       | ms       | 5,883 (5,869–5,894) | 2,739 (2,734–2,745)      | -3,144 (-53.4%) [-3,161, -3,106] | better  |
| Reads triggered by mutations                              | requests | 2                   | 2                        | 0                                | same    |
| Stale views (checked views showing old data)              | views    | 0                   | 0                        | 0                                | same    |
| All steps, action to ready (sum)                          | ms       | 8,674 (8,639–8,759) | 5,563 (5,520–5,591)      | -3,111 (-35.9%) [-3,225, -3,025] | better  |
| API requests                                              | requests | 10                  | 10                       | 0                                | same    |
| API reads (GET)                                           | requests | 4                   | 4                        | 0                                | same    |
| API writes                                                | requests | 6                   | 6                        | 0                                | same    |
| Redundant reads (same URL, same payload already received) | requests | 0                   | 0                        | 0                                | same    |
| Navigations with no loading indicator (of 7)              | navs     | 7                   | 7                        | 0                                | same    |
| Loading indicators shown                                  | count    | 0                   | 0                        | 0                                | same    |
| Loading indicator visible                                 | ms       | 0                   | 0                        | 0                                | same    |
| Long tasks (>50ms)                                        | count    | 0                   | 1.5 (1–2)                | +1.5 [+1, +2]                    | worse   |
| Slowest interaction (input to next paint)                 | ms       | 44 (40–48)          | 76 (70–80)               | +32 (+72.7%) [+20, +40]          | worse   |
| Layout shift (CLS sum)                                    | score    | 0                   | 0                        | 0                                | same    |
| Reads the redundancy check could not hash                 | requests | 0                   | 0                        | 0                                | same    |
| Total blocking time                                       | ms       | 0                   | 15 (9.5–19.8)            | +15 [+7.44, +22]                 | worse   |

## Cold load

| Metric                    | Unit | data-client         | data-client + optimistic | Change                       | Verdict      |
| ------------------------- | ---- | ------------------- | ------------------------ | ---------------------------- | ------------ |
| First screen ready        | ms   | 1,708 (1,658–1,722) | 1,783 (1,732–1,841)      | +75 (+4.4%) [-2.01, +195]    | within noise |
| Load event                | ms   | 426 (327–457)       | 430 (413–442)            | +3.5 (+0.8%) [-47, +151]     | within noise |
| Largest contentful paint  | ms   | 1,552 (1,476–1,595) | 1,658 (1,601–1,785)      | +106 (+6.8%) [+8, +294]      | worse        |
| JS parse + compile        | ms   | 534 (509–548)       | 579 (557–644)            | +45.6 (+8.5%) [-13.8, +131]  | within noise |
| JS module evaluation      | ms   | 468 (456–480)       | 537 (481–573)            | +68.5 (+14.6%) [-1.22, +138] | within noise |
| Main-thread JS            | ms   | 768 (737–790)       | 850 (811–948)            | +82.2 (+10.7%) [+7.95, +208] | worse        |
| Total blocking time       | ms   | 358 (343–382)       | 428 (401–483)            | +70 (+19.6%) [+11, +157]     | worse        |
| Loading indicator visible | ms   | 0                   | 0                        | 0                            | same         |
| JS heap                   | MB   | 7.72 (7.71–7.73)    | 7.71 (7.71–7.72)         | -0.01 (-0.1%) [-0.02, +0.01] | within noise |

## Nav steps

| Metric                                             | Unit     | data-client   | data-client + optimistic | Change                       | Verdict      |
| -------------------------------------------------- | -------- | ------------- | ------------------------ | ---------------------------- | ------------ |
| open discussions: action to ready                  | ms       | 924 (916–929) | 937 (926–954)            | +13.5 (+1.5%) [-3.51, +37.5] | within noise |
| open discussions: reads                            | requests | 1             | 1                        | 0                            | same         |
| open discussion: action to ready                   | ms       | 932 (917–949) | 922 (919–940)            | -10 (-1.1%) [-31.5, +22]     | within noise |
| open discussion: reads                             | requests | 1             | 1                        | 0                            | same         |
| back to list (shows rename?): action to ready      | ms       | 117 (103–142) | 115 (104–118)            | -2.5 (-2.1%) [-40.5, +18.5]  | within noise |
| back to list (shows rename?): reads                | requests | 0             | 0                        | 0                            | same         |
| reopen discussion (comment gone?): action to ready | ms       | 102 (95–109)  | 96.5 (91.3–102)          | -5.5 (-5.4%) [-20, +9.5]     | within noise |
| reopen discussion (comment gone?): reads           | requests | 0             | 0                        | 0                            | same         |
| profile: action to ready                           | ms       | 518 (517–533) | 542 (535–544)            | +24 (+4.6%) [+1.49, +28.5]   | worse        |
| profile: reads                                     | requests | 0             | 0                        | 0                            | same         |
| dashboard (shows new name?): action to ready       | ms       | 95.5 (85–100) | 93.5 (91.8–95.8)         | -2 (-2.1%) [-12, +11]        | within noise |
| dashboard (shows new name?): reads                 | requests | 0             | 0                        | 0                            | same         |
| list again: action to ready                        | ms       | 94 (90.5–97)  | 102 (93–104)             | +7.5 (+8%) [-6, +15]         | within noise |
| list again: reads                                  | requests | 0             | 0                        | 0                            | same         |

## Mutation steps

| Metric                                  | Unit     | data-client         | data-client + optimistic | Change                     | Verdict      |
| --------------------------------------- | -------- | ------------------- | ------------------------ | -------------------------- | ------------ |
| create discussion: submit to UI updated | ms       | 1,402 (1,398–1,416) | 1,398 (1,396–1,406)      | -4 (-0.3%) [-21, +15]      | within noise |
| create discussion: follow-up reads      | requests | 1                   | 1                        | 0                          | same         |
| update discussion: submit to UI updated | ms       | 893 (888–904)       | 110 (103–114)            | -783 (-87.7%) [-800, -774] | better       |
| update discussion: follow-up reads      | requests | 0                   | 0                        | 0                          | same         |
| create comment: submit to UI updated    | ms       | 892 (874–916)       | 136 (132–148)            | -756 (-84.7%) [-784, -731] | better       |
| create comment: follow-up reads         | requests | 0                   | 0                        | 0                          | same         |
| delete comment: submit to UI updated    | ms       | 901 (894–907)       | 91 (76.5–99.3)           | -810 (-89.9%) [-830, -795] | better       |
| delete comment: follow-up reads         | requests | 0                   | 0                        | 0                          | same         |
| update profile: submit to UI updated    | ms       | 892 (883–897)       | 112 (105–117)            | -780 (-87.4%) [-796, -767] | better       |
| update profile: follow-up reads         | requests | 0                   | 0                        | 0                          | same         |
| delete discussion: submit to UI updated | ms       | 889 (880–903)       | 890 (886–899)            | +1 (+0.1%) [-16, +17.5]    | within noise |
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
