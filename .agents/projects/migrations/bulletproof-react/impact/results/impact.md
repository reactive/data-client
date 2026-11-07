# bulletproof-react: react-query vs data-client

- Flow: 10 interleaved runs per variant at 4x CPU throttle; 13 steps (6 mutations).
- Sampled rows show median (interquartile range); the change column adds a 95% bootstrap interval in brackets. "Within noise" means that interval includes zero.

**35 better, 1 worse, 14 within noise** (rows with a preferred direction).

## Flow

| Metric                                                    | Unit     | react-query            | data-client            | Change                           | Verdict |
| --------------------------------------------------------- | -------- | ---------------------- | ---------------------- | -------------------------------- | ------- |
| Mutation submit to UI updated (sum)                       | ms       | 11,063 (11,012–11,100) | 8,999 (8,969–9,030)    | -2,064 (-18.7%) [-2,130, -1,993] | better  |
| Reads triggered by mutations                              | requests | 6                      | 2                      | -4 (-66.7%)                      | better  |
| Stale views (checked views showing old data)              | views    | 2                      | 0                      | -2 (-100%)                       | better  |
| All steps, action to ready (sum)                          | ms       | 13,882 (13,803–13,953) | 11,774 (11,724–11,818) | -2,108 (-15.2%) [-2,217, -2,002] | better  |
| API requests                                              | requests | 15                     | 10                     | -5 (-33.3%)                      | better  |
| API reads (GET)                                           | requests | 9                      | 4                      | -5 (-55.6%)                      | better  |
| API writes                                                | requests | 6                      | 6                      | 0                                | same    |
| Redundant reads (same URL, same payload already received) | requests | 0                      | 0                      | 0                                | same    |
| Navigations with no loading indicator (of 7)              | navs     | 7                      | 7                      | 0                                | same    |
| Loading indicators shown                                  | count    | 0                      | 0                      | 0                                | same    |
| Loading indicator visible                                 | ms       | 0                      | 0                      | 0                                | same    |
| Long tasks (>50ms)                                        | count    | 0                      | 0                      | 0                                | same    |
| Total blocking time                                       | ms       | 0                      | 0                      | 0                                | same    |

## Cold load

| Metric                    | Unit | react-query         | data-client         | Change                       | Verdict      |
| ------------------------- | ---- | ------------------- | ------------------- | ---------------------------- | ------------ |
| First screen ready        | ms   | 1,653 (1,629–1,722) | 1,668 (1,654–1,739) | +15 (+0.9%) [-74.0, +114]    | within noise |
| Load event                | ms   | 437 (427–446)       | 421 (408–437)       | -16 (-3.7%) [-37, +9]        | within noise |
| Largest contentful paint  | ms   | 1,572 (1,546–1,638) | 1,544 (1,523–1,619) | -28 (-1.8%) [-108, +62]      | within noise |
| JS parse + compile        | ms   | 530 (506–561)       | 511 (490–567)       | -19.5 (-3.7%) [-66.4, +50.0] | within noise |
| JS module evaluation      | ms   | 469 (462–508)       | 455 (443–483)       | -13.9 (-3%) [-61.9, +18.4]   | within noise |
| Main-thread JS            | ms   | 788 (776–834)       | 757 (739–813)       | -31.6 (-4%) [-99.2, +32.3]   | within noise |
| Total blocking time       | ms   | 349 (332–386)       | 353 (324–387)       | +3.5 (+1%) [-53, +47]        | within noise |
| Loading indicator visible | ms   | 565 (557–576)       | 0                   | -565 (-100%) [-576, -556]    | better       |
| JS heap                   | MB   | 8.1 (8.09–8.12)     | 7.72 (7.71–7.73)    | -0.38 (-4.7%) [-0.4, -0.37]  | better       |

## Nav steps

| Metric                                             | Unit     | react-query     | data-client    | Change                      | Verdict      |
| -------------------------------------------------- | -------- | --------------- | -------------- | --------------------------- | ------------ |
| open discussions: action to ready                  | ms       | 927 (917–940)   | 942 (934–960)  | +15 (+1.6%) [-8.01, +40.5]  | within noise |
| open discussions: reads                            | requests | 1               | 1              | 0                           | same         |
| open discussion: action to ready                   | ms       | 954 (929–974)   | 912 (904–918)  | -42 (-4.4%) [-68, -12.5]    | better       |
| open discussion: reads                             | requests | 2               | 1              | -1 (-50%)                   | better       |
| back to list (shows rename?): action to ready      | ms       | 106 (101–115)   | 111 (99.8–114) | +5.5 (+5.2%) [-10.5, +11]   | within noise |
| back to list (shows rename?): reads                | requests | 0               | 0              | 0                           | same         |
| reopen discussion (comment gone?): action to ready | ms       | 112 (98.5–117)  | 97 (91–100)    | -15 (-13.4%) [-28, -0.5]    | better       |
| reopen discussion (comment gone?): reads           | requests | 0               | 0              | 0                           | same         |
| profile: action to ready                           | ms       | 528 (522–536)   | 531 (520–533)  | +3 (+0.6%) [-14, +11.5]     | within noise |
| profile: reads                                     | requests | 0               | 0              | 0                           | same         |
| dashboard (shows new name?): action to ready       | ms       | 89.5 (80.3–100) | 90 (84.3–103)  | +0.5 (+0.6%) [-13.5, +18.5] | within noise |
| dashboard (shows new name?): reads                 | requests | 0               | 0              | 0                           | same         |
| list again: action to ready                        | ms       | 102 (99.3–109)  | 97 (92.5–107)  | -5 (-4.9%) [-15.5, +7]      | within noise |
| list again: reads                                  | requests | 0               | 0              | 0                           | same         |

## Mutation steps

| Metric                                  | Unit     | react-query         | data-client         | Change                       | Verdict      |
| --------------------------------------- | -------- | ------------------- | ------------------- | ---------------------------- | ------------ |
| create discussion: submit to UI updated | ms       | 2,297 (2,276–2,308) | 2,282 (2,277–2,286) | -15.5 (-0.7%) [-30.5, +8.51] | within noise |
| create discussion: follow-up reads      | requests | 1                   | 1                   | 0                            | same         |
| update discussion: submit to UI updated | ms       | 2,277 (2,271–2,291) | 1,774 (1,769–1,781) | -504 (-22.1%) [-521, -489]   | better       |
| update discussion: follow-up reads      | requests | 1                   | 0                   | -1 (-100%)                   | better       |
| create comment: submit to UI updated    | ms       | 2,287 (2,272–2,300) | 1,778 (1,770–1,787) | -509 (-22.2%) [-528, -488]   | better       |
| create comment: follow-up reads         | requests | 1                   | 0                   | -1 (-100%)                   | better       |
| delete comment: submit to UI updated    | ms       | 1,616 (1,604–1,618) | 1,096 (1,082–1,103) | -521 (-32.2%) [-564, -505]   | better       |
| delete comment: follow-up reads         | requests | 1                   | 0                   | -1 (-100%)                   | better       |
| update profile: submit to UI updated    | ms       | 2,286 (2,283–2,288) | 1,769 (1,766–1,781) | -518 (-22.6%) [-522, -503]   | better       |
| update profile: follow-up reads         | requests | 1                   | 0                   | -1 (-100%)                   | better       |
| delete discussion: submit to UI updated | ms       | 300 (291–313)       | 304 (302–309)       | +4 (+1.3%) [-13, +16]        | within noise |
| delete discussion: follow-up reads      | requests | 1                   | 1                   | 0                            | same         |

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
| Entry JS, gzip   | kB   | 178         | 162         | -16.1 (-9.1%) | better  |
| Entry JS, brotli | kB   | 153         | 139         | -14.3 (-9.3%) | better  |
| Entry JS, raw    | kB   | 553         | 509         | -44.2 (-8%)   | better  |
| All JS, gzip     | kB   | 233         | 215         | -17.7 (-7.6%) | better  |
| All JS, brotli   | kB   | 202         | 187         | -15.5 (-7.6%) | better  |
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
