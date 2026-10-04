# Recorded clips

Short `.webm` clips for [`<AutoPlayVideo>`](../../src/components/AutoPlayVideo.tsx), recorded with Playwright so
they can be regenerated each release instead of screen-captured by hand.

```bash
yarn workspace rdc-website record-videos                     # every clip
yarn workspace rdc-website record-videos batch-set-devtools  # one clip
```

Each clip is written to `website/static/videos/blog/<name>.webm`. Commit the result.

The first time, install Playwright's Chromium with `yarn workspace rdc-website playwright install chromium`, or point
`CHROMIUM_PATH` at an existing Chromium binary (for example `CHROMIUM_PATH=/opt/pw-browsers/chromium` in cloud agents,
which must not run `playwright install`).

## How it works

[`record.mjs`](./record.mjs) bundles each scene with esbuild, using workspace `packages/*/src` like the tests do, then
serves it to a Playwright page with `recordVideo` on. A scene is a small React page that plays its own script and
exports a `window.clipDone` promise; recording stops when it resolves. Scenes don't touch the network, so every
recording is identical.

[`devtools.tsx`](./devtools.tsx) stands in for the Redux DevTools extension: it implements
`window.__REDUX_DEVTOOLS_EXTENSION__.connect()` and renders each [DevToolsManager](https://dataclient.io/docs/api/DevToolsManager)
connection with the extension's Inspector monitor (`@redux-devtools/inspector-monitor`).

## Clips

| Clip                 | Shows                                                                                  | Embedded in                          |
| -------------------- | -------------------------------------------------------------------------------------- | ------------------------------------ |
| `batch-set-devtools` | Coin app `StreamManager` bursts of 500 ticker messages: per-message `set()` vs batched | `blog/2026-10-03-v0.19-batch-set.md` |

## Adding a clip

1. Add a scene `<name>.tsx` here that renders into `#root` and sets `window.clipDone`.
2. Register it in `CLIPS` in `record.mjs`, and add it to the table above.
3. Embed it with `alt` text, and put the code it demonstrates in a fenced block next to it so the content is still
   readable without the video:

```mdx
import useBaseUrl from '@docusaurus/useBaseUrl';
import AutoPlayVideo from '@site/src/components/AutoPlayVideo';

<AutoPlayVideo
  src={useBaseUrl('/videos/blog/<name>.webm')}
  type="video/webm"
  width="100%"
  alt="What the clip shows, step by step"
/>
```
