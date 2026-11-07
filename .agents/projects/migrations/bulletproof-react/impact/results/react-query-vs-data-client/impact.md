# bulletproof-react: react-query vs data-client

- Flow: 8 interleaved runs per variant at 4x CPU throttle; 13 steps (6 mutations).
- Sampled rows show median (interquartile range); the change column adds a 95% bootstrap interval in brackets. "Within noise" means that interval includes zero.

## Setup

| Variant     | Commit                                   | Uncommitted files | Working-tree diff sha1 |
| ----------- | ---------------------------------------- | ----------------- | ---------------------- |
| react-query | 9506629ed003a561c6627735480cce4994244bb4 | 5                 | –                      |
| data-client | 9506629ed003a561c6627735480cce4994244bb4 | 58                | –                      |

Config `../data-client/.agents/projects/migrations/bulletproof-react/impact/impact.config.mjs`, prep `fixed-latency.patch`, Node v22.23.4, Playwright 1.65.0.

## Flow

| Metric                                                    | Unit     | react-query         | data-client         | Change                           | Verdict      |
| --------------------------------------------------------- | -------- | ------------------- | ------------------- | -------------------------------- | ------------ |
| Mutation submit to UI updated (sum)                       | ms       | 7,032 (7,010–7,106) | 4,975 (4,958–5,008) | -2,057 (-29.3%) [-2,144, -2,009] | better       |
| Reads triggered by mutations                              | requests | 6                   | 2                   | -4 (-66.7%)                      | better       |
| Stale views (checked views showing old data)              | views    | 2                   | 0                   | -2 (-100%)                       | better       |
| All steps, action to ready (sum)                          | ms       | 9,830 (9,749–9,937) | 7,731 (7,663–7,773) | -2,099 (-21.4%) [-2,268, -1,988] | better       |
| API requests                                              | requests | 15                  | 10                  | -5 (-33.3%)                      | better       |
| API reads (GET)                                           | requests | 9                   | 4                   | -5 (-55.6%)                      | better       |
| API writes                                                | requests | 6                   | 6                   | 0                                | same         |
| Redundant reads (same URL, same payload already received) | requests | 0                   | 0                   | 0                                | same         |
| Navigations with no loading indicator (of 7)              | navs     | 7                   | 7                   | 0                                | same         |
| Loading indicators shown                                  | count    | 0                   | 0                   | 0                                | same         |
| Loading indicator visible                                 | ms       | 0                   | 0                   | 0                                | same         |
| Long tasks (>50ms)                                        | count    | 0                   | 0                   | 0                                | same         |
| Slowest interaction (input to next paint)                 | ms       | 40 (40–48)          | 40 (32–40)          | 0 [-12, 0]                       | within noise |
| Layout shift (CLS sum)                                    | score    | 0                   | 0                   | 0                                | same         |
| Reads the redundancy check could not hash                 | requests | 0                   | 0                   | 0                                | same         |
| Total blocking time                                       | ms       | 0                   | 0                   | 0                                | same         |

## Cold load

| Metric                    | Unit | react-query         | data-client         | Change                       | Verdict      |
| ------------------------- | ---- | ------------------- | ------------------- | ---------------------------- | ------------ |
| First screen ready        | ms   | 1,665 (1,617–1,722) | 1,646 (1,628–1,667) | -18.5 (-1.1%) [-91.5, +67.0] | within noise |
| Load event                | ms   | 425 (409–467)       | 416 (401–468)       | -9 (-2.1%) [-65, +55.5]      | within noise |
| Largest contentful paint  | ms   | 1,596 (1,523–1,657) | 1,512 (1,495–1,534) | -84 (-5.3%) [-158, +12]      | within noise |
| JS parse + compile        | ms   | 518 (493–573)       | 490 (470–500)       | -27.2 (-5.3%) [-106, +8.78]  | within noise |
| JS module evaluation      | ms   | 458 (442–510)       | 433 (419–445)       | -24.2 (-5.3%) [-111, +22.9]  | within noise |
| Main-thread JS            | ms   | 783 (749–861)       | 717 (684–731)       | -65.7 (-8.4%) [-184, -16.4]  | better       |
| Total blocking time       | ms   | 328 (305–398)       | 317 (308–329)       | -11.5 (-3.5%) [-121, +37]    | within noise |
| Loading indicator visible | ms   | 565 (558–575)       | 0                   | -565 (-100%) [-578, -556]    | better       |
| JS heap                   | MB   | 8.1 (8.1–8.11)      | 7.71 (7.7–7.72)     | -0.39 (-4.8%) [-0.41, -0.38] | better       |

## Nav steps

| Metric                                             | Unit     | react-query     | data-client      | Change                     | Verdict      |
| -------------------------------------------------- | -------- | --------------- | ---------------- | -------------------------- | ------------ |
| open discussions: action to ready                  | ms       | 926 (920–943)   | 931 (922–936)    | +5.5 (+0.6%) [-30.5, +16]  | within noise |
| open discussions: reads                            | requests | 1               | 1                | 0                          | same         |
| open discussion: action to ready                   | ms       | 939 (931–966)   | 911 (907–924)    | -27.5 (-2.9%) [-63.5, -8]  | better       |
| open discussion: reads                             | requests | 2               | 1                | -1 (-50%)                  | better       |
| back to list (shows rename?): action to ready      | ms       | 96 (94.3–112)   | 96.5 (89.3–106)  | +0.5 (+0.5%) [-22, +12]    | within noise |
| back to list (shows rename?): reads                | requests | 0               | 0                | 0                          | same         |
| reopen discussion (comment gone?): action to ready | ms       | 92.5 (85–103)   | 88.5 (86.8–91.5) | -4 (-4.3%) [-20, +7]       | within noise |
| reopen discussion (comment gone?): reads           | requests | 0               | 0                | 0                          | same         |
| profile: action to ready                           | ms       | 527 (513–531)   | 522 (517–531)    | -5.5 (-1%) [-16, +19]      | within noise |
| profile: reads                                     | requests | 0               | 0                | 0                          | same         |
| dashboard (shows new name?): action to ready       | ms       | 89 (82.8–94)    | 83.5 (79.3–91.3) | -5.5 (-6.2%) [-15, +8]     | within noise |
| dashboard (shows new name?): reads                 | requests | 0               | 0                | 0                          | same         |
| list again: action to ready                        | ms       | 98.5 (92.5–104) | 90 (87.8–92.5)   | -8.5 (-8.6%) [-16.0, -0.5] | better       |
| list again: reads                                  | requests | 0               | 0                | 0                          | same         |

## Mutation steps

| Metric                                  | Unit     | react-query         | data-client         | Change                     | Verdict      |
| --------------------------------------- | -------- | ------------------- | ------------------- | -------------------------- | ------------ |
| create discussion: submit to UI updated | ms       | 1,396 (1,389–1,416) | 1,384 (1,380–1,391) | -12.5 (-0.9%) [-36, +6]    | within noise |
| create discussion: follow-up reads      | requests | 1                   | 1                   | 0                          | same         |
| update discussion: submit to UI updated | ms       | 1,394 (1,389–1,417) | 882 (871–887)       | -512 (-36.7%) [-544, -501] | better       |
| update discussion: follow-up reads      | requests | 1                   | 0                   | -1 (-100%)                 | better       |
| create comment: submit to UI updated    | ms       | 1,395 (1,388–1,412) | 877 (872–887)       | -518 (-37.1%) [-540, -499] | better       |
| create comment: follow-up reads         | requests | 1                   | 0                   | -1 (-100%)                 | better       |
| delete comment: submit to UI updated    | ms       | 1,392 (1,390–1,410) | 875 (866–880)       | -517 (-37.2%) [-544, -508] | better       |
| delete comment: follow-up reads         | requests | 1                   | 0                   | -1 (-100%)                 | better       |
| update profile: submit to UI updated    | ms       | 1,384 (1,378–1,391) | 880 (871–890)       | -504 (-36.4%) [-519, -488] | better       |
| update profile: follow-up reads         | requests | 1                   | 0                   | -1 (-100%)                 | better       |
| delete discussion: submit to UI updated | ms       | 72.5 (65.3–81.3)    | 73 (64.5–81.5)      | +0.5 (+0.7%) [-17, +16]    | within noise |
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
