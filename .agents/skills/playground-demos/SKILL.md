---
name: playground-demos
description: Choose and write live playground demos for the dataclient.io docs site and homepage (HooksPlayground examples, the homepage demo, their fixtures). Use when adding, redesigning or reviewing a docs demo, or coming up with a new demo idea for a feature.
metadata:
  internal: true
---

# Playground demos

How playgrounds work is in the [Playground README](../../../website/src/components/Playground/README.md), mainly its Layouts and Design system sections.

## Goal

A demo soft-sells Data Client first and teaches users and agents how to use it second. People copy what they see and agents copy the code, so both teach.

- **Use case**: one where the preview clearly shows the feature's advantage over the alternative.
- **Mechanism**: easy to see how it works and why it's better.
- **Look**: very beautiful, built from the playground design system, with no inline styles or CSS in the example code.
- **Scope**: as simple as possible while still showing maximum value, utility and related features.
- **New ideas**: inventing one needs at least high reasoning effort. At lower or unknown effort, hand the ideation to a high-effort subagent or ask the user.

## Conventions

- The demo makes its point without captions or narration text. If it needs them, pick another use case.
- Loading states are skeletons (`<Loading />`, `skeleton`), not "Loading…" text.
- A demo of a real public API calls its real URL, intercepted by a fixture in `website/src/fixtures/`, so copied code works.
- The code follows the practices a careful app would, even where the demo could skip them, because readers copy it.
- Use the `row` layout, with one uncollapsed file, when the code is the lesson. Use `demo`, which hides the code, only when the point is purely visual, and ask the user first.
- Anything extra a demo needs goes in the demo code with a design-system component, never a new Playground prop.
- Build the app to work at 256px wide. Where more room makes a better layout (a list beside what it opens), add a DesignSystem class that switches on a container query on its own element, as `.split` does, never a viewport media query, since the app's width doesn't follow the screen's. The app's width inside the preview, for screens from 320 to 2560px:

  | Where                                                       | App width |
  | ----------------------------------------------------------- | --------- |
  | Docs, `row`, beside the code                                | 256–613px |
  | Homepage, `row`, beside the code                            | 256–331px |
  | `row`, playground under 720px wide (preview under the code) | 288–718px |
  | Docs, stacked                                               | 288–958px |

- Check phone width and both themes.
