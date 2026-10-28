# Code On Screen

**Don't just type your code. Present it.**

No live coding, no typos to edit out. Paste your code, add explanations as comments, start Presentation Mode – and the code types itself character by character in a VS Code-style editor while you explain. Record it with OBS Studio.

- Realistic typing: natural rhythm, optional typos that get corrected, optional keyboard sound – with a preview right in the control panel
- Callouts (speech bubbles) next to a line, fading out after a reading time
- Script the presentation in the code, in any language: `@@callout`, `@@highlight` (box around the next line, then pause), `@@pause` and `@@step` (a step title next to the file name). A line with a marker is never shown; comments without a marker are typed like code
- Highlight the line being typed with H, zoom in with Z
- Laser pointer or spotlight that follows the mouse
- 16:9 for YouTube or 9:16 for TikTok, Reels and Shorts
- A control panel with every setting in view, and a tooltip on every control – switch help text off when you know the app
- Dark and light theme, line numbers on or off, everything driven from the keyboard
- C#, JavaScript, TypeScript, Python, Bash, PowerShell, HTML, CSS, SQL, JSON and XML
- Runs entirely in the browser – a static site, no backend

## Getting started

Requires Node.js 20 or later.

```bash
npm install
npm run dev          # http://localhost:5173
```

## Keyboard

| Key       | Where                | Action                                                                  |
| --------- | -------------------- | ----------------------------------------------------------------------- |
| R / G / B | Anytime              | Highlight colour red, green, blue                                       |
| M         | Anytime              | Mixed colours: each new highlight gets a different colour than the last |
| P         | Anytime              | Pointer: none → laser → spotlight                                       |
| T         | Anytime              | Dark / light theme                                                      |
| ?         | Start page           | Guide                                                                   |
| Space     | In Presentation Mode | Start typing / pause / resume                                           |
| H         | In Presentation Mode | Highlight the line being typed (pauses at line end); again: grow upward |
| Z         | In Presentation Mode | Zoom in on the highlight / zoom out                                     |
| N         | In Presentation Mode | New start: clear the editor and begin the take again                    |
| Esc       | In Presentation Mode | Leave Presentation Mode                                                 |

## Scripts

| Script               | What it does                                               |
| -------------------- | ---------------------------------------------------------- |
| `npm run dev`        | Development server with hot reload                         |
| `npm run build`      | Typecheck and build the static site into `dist/`           |
| `npm run preview`    | Serve the built `dist/` locally                            |
| `npm test`           | Unit tests (Vitest)                                        |
| `npm run lint`       | ESLint                                                     |
| `npm run format`     | Prettier – rewrites files                                  |
| `npm run docs`       | API documentation from the TSDoc comments into `docs/api/` |
| `npm run check`      | Everything CI runs: types, lint, formatting, docs, tests   |
| `npm run deploy:vps` | Check, build and rsync to a VPS (see `docs/DEPLOY.md`)     |

## Tech

TypeScript, React 19, Monaco Editor (the editor in VS Code), Vite, Vitest, ESLint, Prettier and TypeDoc. Sound is synthesised with the Web Audio API; settings are kept in `localStorage`.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) – how it is built and why (Swedish)
- [docs/LARGUIDE.md](docs/LARGUIDE.md) – a reading order through the code with questions (Swedish)
- [docs/DEPLOY.md](docs/DEPLOY.md) – GitHub Pages and VPS step by step (Swedish)
- `npm run docs` – generated API reference
