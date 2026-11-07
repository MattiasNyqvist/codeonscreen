# On Screen – System Documentation

This document describes how On Screen works and why it is built the way it is. It is written for a developer who is new to the code base. For deployment, see [DEPLOY.md](DEPLOY.md). For the API of individual functions, run `npm run docs` (generated from the TSDoc comments into `docs/api/`).

## 1. Purpose and principles

On Screen is a stage, not an editor. The user pastes code, adds explanations as comments, and starts Presentation Mode. From then on the code types itself, character by character, in a VS Code-style editor, while the presenter talks. The result is recorded with a tool such as OBS Studio.

Monaco is used to _draw_ code so that it looks like VS Code. On the stage nobody types: all text comes from an engine that presses keys on a timer. Almost every decision below follows from that difference.

Design principles:

- **A static site.** No backend, no account, no network calls at runtime. Everything runs in the browser, and the user's code never leaves the computer.
- **Nothing in the way of the recording.** Presentation Mode has no buttons and opens no dialogs, so nothing can end up in a recording by accident.
- **Self-explaining.** Every control has a tooltip, and the editor labels what each script command will do. Help text can be switched off by experienced users to win back space.
- **Testable core.** The typing engine, source preparation, reading times, frame logic and camera maths are plain functions that run in unit tests without a browser.

## 2. Technology

| Area         | Choice                                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------------------------- |
| Language     | TypeScript (strict)                                                                                                   |
| UI           | React 19                                                                                                              |
| Editor       | Monaco Editor (`monaco-editor`, `@monaco-editor/react`)                                                               |
| Build        | Vite (`base: './'`, so the build works at any path)                                                                   |
| Tests        | Vitest                                                                                                                |
| Quality      | ESLint, Prettier, TypeDoc (documentation is enforced)                                                                 |
| Fonts        | Inter for the interface, Poppins SemiBold for the name and JetBrains Mono for code, all bundled through `@fontsource` |
| Sound        | Synthesised with the Web Audio API – no audio files                                                                   |
| Persistence  | `localStorage` only                                                                                                   |
| Requirements | Node.js 20 or later for development; any modern browser for use                                                       |

## 3. The user interface

The app has two views, switched in `App.tsx`: the **start page** (called `setup` in the code) and **Presentation Mode** (called `stage`).

### 3.1 Start page

The start page reads from top to bottom and is meant to pass a five-second test: a newcomer should understand what to do without opening a dialog.

**Layout.** Header on top. Below it, two columns: the code on the left and the **Settings** panel on the right (440 px). The panel opens and closes from its own title; closed, it is a 44 px strip and the code has the whole width. The choice is remembered (`code-on-screen.control-panel-open`), and the panel is open on a first visit, so a newcomer sees every setting. Settings are set about once per session, and an experienced user closes the panel once. Below 960 px the columns stack: code, then settings, and the page scrolls.

**Header.** The logo _On Screen_ and the tagline _Don't just type your code. Present it._ On the right: the switches **Help text** and **Dark mode**, and a **Guide** button. All buttons except Start are outlined, so it is always clear which action matters most.

**The code.** Above the editor is one bar: the title **Paste your code**, then _Show code as_ and **Clear code** (the language and Clear belong to the code, so they sit beside its title), and at the far end the one filled button on the page, **Start Presentation Mode**, where the code ends and the presenting begins. Start is disabled while the editor is empty; its tooltip says why and names the keys (Space to start, Esc to leave). Until Presentation Mode has been tried once, the button gently pulses. On a narrow screen Start gets a row of its own. There is no step numbering: only two things are required (code, then Start), and the layout says so. When the editor is empty it explains the app to a first-time visitor: the heading **Turn your code into a scripted presentation**, one line (it types itself, you record it with OBS or any screen recorder), and the whole flow as three numbered circles joined by a vertical line: **Add your code** (paste it, or the link _load example code_), **Set it up** (in Settings: speed, highlight and drawing color, commands in comments) and **Present** (the name of the Start button in bold text, and the key `Esc` to leave as a key cap, so that nothing there looks clickable). That text is always shown, help text or not, because it is the empty state, not a hint. **The editor starts empty on a first visit**; the example is only loaded on request.

**Settings** – three framed groups in a scrolling panel:

- _Commands_: the main tick box _Use commands in comments_ and one tick box per command (see section 4), each with the command's icon first, then its name and a short description: _Note next to a line_, _Subtitle at the bottom_, _Pause typing_, _Highlight the line, then pause_, _Title card_. These are tick boxes because they are a list to choose from; the settings that take effect at once (typos, line numbers, help text, dark mode) stay switches.
- _Typing_: _Typing speed_, a **Preview** button that types the first line of the user's code with the chosen settings, _Keystroke sound_ and _Make typos and fix them_. Sliders show no numbers; Preview shows the speed better than "30/s".
- _Look_: the format as two radio buttons (16:9 · YouTube, 9:16 · TikTok · Reels), then _Highlight and draw color_, _Pointer style_, _Spotlight size_ and _Show line numbers in presentation_ (the setup editor never shows line numbers, so the label says where the switch acts).

The keys of Presentation Mode are not on the start page. They are shown when Presentation Mode opens (with help text on), in the Start tooltip and in the Guide (header button, or `?`).

**Tooltips.** Each control explains itself in a tooltip when hovered or focused. The texts live in `models/controlHints.ts` and a test makes sure none is too long. Help text can be switched off, which hides everything that only explains: the notes in the boxes, the tooltips and the tips shown when Presentation Mode opens. What is needed to use the app stays.

**Status bar.** A **Send feedback** link (GitHub Issues, `FEEDBACK_URL` in `app.ts`) followed by the version and build time on the left; in the middle _Runs in your browser – your code is never uploaded._, because a visitor who pastes work code wants to know; on the right the copyright. The author's name links to `AUTHOR_SITE_URL` (MattiasNyqvist.github.io); both links open in a new tab.

### 3.2 Presentation Mode

Presentation Mode is the only thing that is recorded. It is exactly 1920×1080 in 16:9 and 1080×1920 in 9:16, centred, and scaled down only if the window is smaller. It has no buttons, and the mouse cannot affect the code, only move the pointer.

- When the whole take has been typed, it stays. Space does nothing, so a stray key press never wipes the screen in the middle of a recording; **N** (new start) is the only way to begin again. There is no looping.
- On every start the text _Press Space to start · Press Esc to leave Presentation Mode_ is shown for about 2.5 seconds and then fades, so it is gone before recording begins. With help text off it is not shown at all.
- No dialog ever opens in Presentation Mode. A dialog can therefore never end up in a recording.
- The blue Start button is the only way in. The key P is already taken by Pointer.

### 3.3 Keyboard

| Key       | Where                | Action                                                                  |
| --------- | -------------------- | ----------------------------------------------------------------------- |
| R / G / B | Anytime              | Highlight colour red, green, blue                                       |
| M         | Anytime              | Mixed colours: each new highlight differs from the last                 |
| P         | Anytime              | Pointer: none → laser → spotlight                                       |
| T         | Anytime              | Dark / light theme                                                      |
| ?         | Start page           | Open the Guide on the Keyboard tab                                      |
| Space     | In Presentation Mode | Start typing / pause / resume (does nothing once everything is typed)   |
| H         | In Presentation Mode | Highlight the line being typed (pauses at line end); again: grow upward |
| Z         | In Presentation Mode | Zoom in on the highlight / zoom out                                     |
| Wheel     | Paused               | Mouse wheel up zooms in, down zooms out, like Z                         |
| C         | Paused               | Circle tool: drag to draw (again: back to selecting)                    |
| S         | Paused               | Square (box) tool                                                       |
| A         | Paused               | Arrow tool                                                              |
| L         | Paused               | Line tool (an arrow without the head, for underlining)                  |
| D         | Paused               | Delete the selected shape (Delete and Backspace work too)               |
| Enter     | Paused               | Type text in the selected shape; Enter again to finish                  |
| N         | In Presentation Mode | New start: clear the editor and begin the take again                    |
| Esc       | In Presentation Mode | Leave Presentation Mode                                                 |

While a dialog is open the key map is empty, so that, for example, `T` does not change the theme behind the dialog. The key list in the Guide is data (`SHORTCUT_GROUPS` in `HelpDialog.tsx`), kept apart from the bindings in `App.tsx`. Changing a key means changing both places. That is deliberate: generating the help text from the bindings would need every binding to carry its own description, which is more machinery than a dozen keys are worth.

### 3.4 Guide

The Guide is a dialog with four tabs: _How it works_, _Keyboard_, _Recording with OBS_ and _About_ (version, build time, author). It is built on `Modal`, which uses the browser's own `<dialog>` and `showModal()`. The browser handles the blocking backdrop, focus trapping, Esc and the screen-reader roles. React only decides whether the dialog is open.

### 3.5 Wording

The user interface and the guide use the same terms everywhere: _your code_, _Show code as_, _Presentation commands_, _callouts_, _Typing speed_, _Preview_, _Keystroke sound_, _Show line numbers in presentation_, _Highlight and draw color_, _Pointer style_, _Presentation Mode_ and _New start_.

The interface says **Presentation Mode** and **Presentation format**, not Tutorial Mode or Video format, because the app presents; recording is only one use. The interface says **callout** and **highlight**; in the code the same things are `hint`/`bubble` and `frame`, because those names describe what is drawn. Interface words can change without renaming code.

## 4. Scripting in comments

A comment can contain a command, and then it steers the presentation. In the interface these are _presentation commands_; in the code they are _markers_ (`marker`), and the setting is called `scriptMarkers`.

| Command           | Effect                                                                            |
| ----------------- | --------------------------------------------------------------------------------- |
| `@@step Title`    | A title card in the middle of the screen for about 4 seconds; typing waits for it |
| `@@callout Text`  | A note next to the next line (the interface calls it a _callout_)                 |
| `@@subtitle Text` | A TV-style subtitle at the bottom of the screen, once the next line is typed      |
| `@@highlight`     | A box is drawn around the next line once it is typed, and typing pauses           |
| `@@pause`         | Typing pauses after the next line                                                 |

Rules:

- **Markers work the same in every language.** The search looks for `@@` followed by a word and does not care about comment syntax, so `// @@pause`, `# @@pause` and `<!-- @@pause -->` behave the same. A double `@` is what makes it safe: a single `@` collided with real code (`@step` is a decorator in Python and a valid variable name in C#). Two exceptions are built in: `@@` directly after a letter is ignored (Razor writes `info@@example.com`), and so is `@@` followed by a space (a diff header, `@@ -1,3 +1,4 @@`).
- **A line with a marker is never typed** – the whole line, whatever else is on it, whether the marker is on or off, and even when the word after `@@` is misspelled. A misspelled `@@calout` does nothing, but it does not end up in the recording either. For that reason every marker belongs to the _next_ line; trailing markers at the end of a code line do not exist. Callouts, subtitles, highlights and pauses belong to the next line of _code_ (blank and comment-only lines are skipped). A step belongs to the next line with _any_ content, a plain comment included, so its card comes before the comment that introduces the part.
- **A comment without a marker is ordinary code** and is always typed.
- Text after `@@highlight` or `@@pause` also becomes a bubble. A step title is never a bubble: bubbles explain a line, a step says what the section is about. Text after `@@subtitle` is a subtitle, not a bubble, and several `@@subtitle` lines before the same line are joined into one.
- The master switch _Presentation commands_ turns the whole script on or off. Below it each command has its own switch, which remembers its state while the master is off.

**In the editor,** every marker line gets a label after the line (an icon and the command's name, for example _callout_). Marker lines are lime green, because comments are muted green and code is many colours; lime is neither, so a line that will never be shown stands out. In light theme the line also gets a pale lime background. The labels also warn: _unknown command_ when a word after `@@` is not a marker, and _the code on this line is hidden too_ when a marker shares a line with code.

The labels are Monaco decorations with injected text, so they are not part of the code and cannot be selected. Icons are simple outlines: a note with a folded corner (callout), the two bars of a pause button (pause), a box around a line (highlight), a screen with two lines of dashes like closed-caption text (subtitle) and a bookmark (step). The paths live in one place, `components/CommandIcon.tsx`. In the panel they are drawn as SVG. In the editor, where Monaco only accepts text and class names, an icon is two non-breaking spaces painted with the icon as a CSS mask.

**The example** is a small, realistic tutorial – a shopping basket where prices are summed and VAT is added – with real developer comments (why `decimal` and not `double`, where `Sum()` comes from, what `:F2` does). It has two steps and uses every marker, plus one ordinary comment, so the first take shows both the script and that an unmarked comment is typed. The example is only loaded when the user asks for it.

## 5. Architecture

### 5.1 Layers

```text
components  →  hooks  →  engine · source · hints · frame · editor · audio  →  models
```

Dependencies only point to the right. `models` imports nothing. `engine` does not know that React or Monaco exist. That is why the engine, source preparation, reading times, frame logic and camera maths can be tested with ordinary function calls, without a browser. Components have no tests; they are thin on purpose.

| Folder        | Responsibility                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------- |
| `models/`     | Types and constants: languages, settings, frame, keystrokes, playback state, stage formats, hints |
| `engine/`     | The typing engine: source → chunks → keystrokes (with typos) → timer                              |
| `source/`     | Source preparation: script extraction, editor labels, the preview line                            |
| `hints/`      | Bubble reading time and fade-out                                                                  |
| `frame/`      | Frame logic: which line the frame grows to, which lines are dimmed, colour choice                 |
| `editor/`     | Everything close to Monaco: set-up, options, pixel geometry, camera, bubble stacking              |
| `audio/`      | Synthesised key sounds                                                                            |
| `hooks/`      | The glue to React: `usePresenter` (the stage), `useTypewriter` (the engine), settings, keyboard   |
| `components/` | `setup/`, `dialogs/` and `stage/` – presentation, almost no logic                                 |

### 5.2 Who does what

- **`App`** owns the settings, which view is showing, dialogs and the keyboard map. It is deliberately short.
- **`usePresenter`** owns everything that happens on the stage and returns a `Presenter` object: state to draw (`frame`, `hints`, `subtitle`, `stepCard`, `zoomRange` …) and one function per key (`togglePlay`, `stop`, `frameOrGrow`, `toggleZoom`). To understand what a key does on the stage, read this.
- **`CodeStage`** is the only component that touches the stage's Monaco. It offers a small handle through `ref` (`append`, `backspace`, `clear`, `focus`, `getLastLine`, `isLineBlank`). Everything else goes in as props.
- **`SourceEditor`** is the editable Monaco on the start page. Unlike the stage editor it is controlled through `value`.

### 5.3 Settings and persistence

All settings are one `Settings` object saved in `localStorage` under `code-on-screen.settings`. `parseSettings` validates field by field when it is read, so one bad value (for example a colour from an older version) falls back to its default without losing the rest. The function is pure and tested. Default settings (`DEFAULT_SETTINGS`) start with an empty `source`.

Three small flags are saved with `useStoredFlag`, a `useState` that also writes to `localStorage`:

| Key                                 | Meaning                                             |
| ----------------------------------- | --------------------------------------------------- |
| `code-on-screen.played-once`        | Space has been pressed once (stops the Start pulse) |
| `code-on-screen.control-panel-open` | The Settings panel is open                          |
| `code-on-screen.help-text`          | Help text is on (default: on)                       |

Everything is local to the browser. Clearing site data resets the app.

### 5.4 Monaco

`@monaco-editor/react` fetches Monaco from a CDN by default. `monacoSetup.ts` redirects it to `node_modules`, so everything works offline.

The whole of Monaco is not loaded. `editor.api` is the editor without languages, and only the eleven languages the app offers are then registered: C#, JavaScript, TypeScript, Python, Bash, PowerShell, HTML, CSS, SQL, JSON and XML. Ten are Monarch tokenizers (pure colouring, no language service). JSON is only available as a full language service and brings its own worker. The result is 5.3 MB instead of 12; TypeScript's 7 MB language service is gone entirely, and was never used because error markers are off.

The stage editor is not `readOnly`, because then the cursor stops blinking. It is `domReadOnly`: the keyboard is blocked but the cursor lives. Ligatures are off in both editors, so a newcomer who sees `=>` become an arrow does not wonder which keys to press.

JetBrains Mono is part of the build through `@fontsource`, so every computer records the same typeface. Monaco measures character width once, so `monacoSetup` measures again when the font has loaded.

### 5.5 The typing engine

The source goes through three steps before anything is visible:

1. **`tokenize`** splits it into chunks. Each character is a chunk, except indentation, which is one chunk (a person presses Tab once).
2. **`planKeystrokes`** turns chunks into `Keystroke` objects: `{ kind: 'type', text }` or `{ kind: 'backspace' }`. With typos on, about 1.2 % of the letters in the middle of a word go wrong: a neighbouring key is pressed, followed by a backspace and the right letter. The random function is passed in as a parameter, so tests can decide exactly what happens.
3. **`Typewriter`** carries out the keystrokes with `setTimeout`. `timing` gives each keystroke a delay: base rate, ±35 % randomness, ×5 before a line break, ×1.8 before `; { } ( ) , >` and ×4 before a backspace, so it looks like the person has time to see the mistake.

The engine emits events: `onType`, `onBackspace`, `onReset`, `onStateChange`, `onKeystroke` (sound), `onLineComplete` (bubbles) and `onLineEndPause` (H). It is created once in `useTypewriter`. An effect connects it after each render with `connect()`, so it always calls the latest callbacks and never reads a ref during rendering.

### 5.6 Highlight frame (H)

H frames the line being typed, immediately, while the rest of the line keeps being typed into the frame. The font is monospace, so the final width is known in advance. `usePresenter` looks up the line's finished text and passes it as `typingLine`. `geometry.ts` then computes the width from the text (`textColumns`, tabs included) times the character width. When the line is done the engine pauses (`pauseAtLineEnd`). H again grows the frame upward to the nearest line with content. Space removes the frame and continues.

The frame is drawn clockwise, one side per 250 ms. This is pure CSS: four edges scaled from 0 to 1 with different delays (`.frame-outline` in `app.css`). Monaco decorations cannot be animated, which is why the frame is an element of its own. The frame sits inside the camera, so it zooms with the code. While playback is stopped, lines outside the frame are dimmed to 35 %.

In the interface this is called **highlight**; in the code it is `frame`. The setting `frameColor` is a `FrameColorChoice`: one of the colours or `mix`. `pickFrameColor` in `frame/colors.ts` turns the choice into a colour each time a new frame is drawn. With mix, the colour is chosen at random among those that differ from the previous frame, because pure randomness sometimes gave the same colour twice in a row. The keys are the first letter of each choice (R, G, B, M).

### 5.7 Zoom (Z and the mouse wheel)

The mouse wheel does the same as Z: up zooms in, down zooms out. `StageView` listens to `wheel` and calls `zoomIn` or `zoomOut` on the presenter, which, like Z, only act while paused. They do nothing when already in that state, so a trackpad that fires many wheel events at once still gives one zoom.

The camera is a transform (`translate + scale`) on an element around Monaco. `camera.ts` computes the target: at most 1.6×, at most 85 % of the area, centred, with the edges clamped so the camera never shows empty space. The movement is driven with `requestAnimationFrame` over 450 ms, not with a CSS transition. Bubbles sit outside the camera so their text keeps its size, but they must still follow their line. When JavaScript drives the camera, the bubbles can move in the same frame.

### 5.8 Bubbles

`extractScript` lifts the marker lines out before playback, and each marker belongs to the next line of code. A bubble appears when its line is fully typed. It stays for `1.5 s + 1 s per 12 characters`, at least 3 and at most 10 seconds, then fades out. The clock keeps running during pauses: a bubble exists to be read, and reading does not stop because typing does. Only the bubble on the line where the pause waits keeps its time, because that is the line being discussed.

In landscape format the bubble sits five character widths after the last character of its line, with an arrow pointing at the line. `bubbleLeft` moves it in from the edge when the line is so long that the bubble does not fit; a bubble over a little code is better than a bubble that is clipped. `stackBubbles` makes sure bubbles on nearby lines do not overlap and moves the arrow if a bubble has been pushed down. Bubbles are at most 720 px wide so an ordinary comment fits on one line.

### 5.9 Step cards and subtitles

**Step card.** A `@@step Title` stops typing and shows its title in the middle of the screen for `STEP_CARD_MS` (4 seconds, matching the `step-card` animation in `app.css`): it fades in, stays and fades out over a dark scrim, and typing then carries on by itself. The card is a plain overlay in `StageView`, drawn inside the stage so it is part of the recording.

- `extractScript` gives each step the line number of its first line. When the line before it is finished, `usePresenter` marks the step as pending and asks the engine to pause at the end of that line (`pauseAtLineEnd`). When the engine has paused, the card is shown and a timer resumes typing.
- A step on the very first line is shown before anything is typed: the engine is started and paused at once.
- If a `@@highlight`, a `@@pause` or the H key also holds typing at that line, the card waits and is shown when the presenter continues with Space.
- Space during a card skips the rest of it. H and Z do nothing during a card, and N (new start) removes it.
- The reading time of bubbles and subtitles does not run while a card is shown, and a subtitle is hidden behind it, so nothing is read before the card is gone.

**Subtitle.** A `@@subtitle Text` appears at the bottom of the screen once the next line of code is fully typed: white text on a dark strip, centred, at most two lines. One subtitle at a time; a new one replaces the old at once, even if the old one has not been on screen for its whole reading time. Subtitles are deliberately not queued: a queued subtitle would appear after its own line instead of at it, so spacing them out is left to the author, and the Guide says so. It uses the same reading time as bubbles (`readingTimeMs`) and fades out after it, and is held while typing waits at its line (a pause). In portrait it sits above the caption strip and clear of the right edge that TikTok and Reels cover. The state is a `Subtitle` (`models/hint.ts`), advanced by `tickSubtitle` in `hints/lifetime.ts`.

### 5.10 Formats: landscape and portrait

`models/stageFormat.ts` collects everything that differs between the formats in `STAGE_LAYOUTS`: size, text size, line height and where bubbles go. Nothing else in the code needs to know which format is chosen; it reads its layout from there.

Portrait is more than another size. A 9:16 video is shown about 400 points wide on a phone, barely a third of 1080 pixels. The code is therefore 30 px instead of 20, which leaves room for about 50 characters per line. Bubbles after the end of a line would almost always end up outside the edge, so in portrait they become text strips in a field of their own under the code. 300 px is left empty at the bottom and 140 px free on the right in the strip, because TikTok and Reels put name, description and buttons there.

The portrait stage is 1920 px high, more than a 1080p screen. It is scaled down and recorded at about half the sharpness. The app cannot fix that; the guide says so plainly and suggests a larger screen or a screen turned on its side.

### 5.11 Pointer (P)

`PointerOverlay` listens to mouse movement and writes the position to CSS variables, with no React rendering per movement. The position is converted to the stage's coordinates, since the stage may be scaled down. The laser is a glowing dot. The spotlight is a radial gradient that darkens everything except a circle. The radius comes from the setting `spotlightRadius` (60–300 px, default 112) through the CSS variable `--spotlight-radius`, and the soft edge is 27 % of the radius, so large and small spotlights look alike. In light theme it darkens less, because a dark veil over a white background looks harsh. Both fade out 1.5 seconds after the mouse stops, and the system cursor is hidden so there are not two pointers in the picture.

### 5.12 Drawing on the paused stage (C, S, A)

While Presentation Mode is paused, the presenter can draw circles, boxes, arrows and lines over the code, like a light version of Excalidraw. The drawings are a layer: they never touch the code, are never saved, and are dropped the moment typing carries on or the take is restarted.

- **State.** `useDrawing(enabled, colorChoice)` holds the shapes, the active tool, the selected shape and the shape being typed in. `enabled` is `presenter.state === 'paused'`. When it turns false the state is reset _while rendering_ (the "adjust state when a prop changes" pattern), not in an effect, so a shape is never painted for one frame after the pause has ended.
- **Geometry.** `drawing/geometry.ts` is pure and unit-tested: bounds, hit testing, handles, moving, resizing, arrow head. A line is an arrow without the head (`isSegment` covers both). Shapes are stored in stage pixels (1920×1080 or 1080×1920), never in screen pixels, so the drawing does not depend on the window size. `DrawingLayer` converts the mouse position the same way `PointerOverlay` does.
- **Rendering.** `DrawingLayer` is one SVG over the stage, rendered only while paused. A circle and a box are two opposite corners of a bounding box and have eight handles; an arrow or a line has two end points. Only the line of a shape counts as a hit, not its inside, so a click inside a box does not grab it.
- **Keys.** C, S and A choose a tool (the same key again goes back to selecting), D, Delete and Backspace remove the selected shape, Enter types text in it. The bindings are in `stageKeys` in `App.tsx` and do nothing unless paused. After one shape is drawn the tool goes back to selecting and the new shape is selected, as in Excalidraw.
- **Colour.** A new shape takes the highlight colour setting; `mix` picks a colour that differs from the last. R, G, B and M also recolour a selected shape.
- **Text.** Letters are commands, so typing "database" would trigger A, D and B. Enter on a selected shape opens a text field instead. `useKeyboardShortcuts` already ignores text fields, so every key is an ordinary letter there. Enter ends the text. Esc ends it too, but does not leave Presentation Mode, so a label is never lost by a slip.
- **Spotlight.** The spotlight darkens everything outside a circle around the mouse, which would make drawing impossible. `StageView` therefore switches it off while a tool is chosen or any shape exists, and it returns when typing carries on. The Pointer setting itself is not changed. The laser dot stays, since it hides nothing.
- **Zoom.** The drawing is in stage coordinates, not editor coordinates, so it does not follow the code when Z zooms. Draw before or after zooming, not across it.

### 5.13 Visual design

The start page aims for a calm, professional look: neutral cool greys, one blue accent, and surfaces with a little thickness instead of flat fills.

- **Type.** The interface uses Inter (variable font, bundled), the code uses JetBrains Mono.
- **Depth.** Cards and the header have a lit top edge (`--highlight`) and, for floating things such as the control panel, tooltips and dialogs, a soft shadow (`--shadow-md`). Frames use `--border-strong`, hairlines use `--border`.
- **The name.** _On Screen_ in the header is a relief, not a colour overlay: a single blue taken from the logo (it works on both the dark and the light background) that is light at the top and deep at the bottom (`--logo-top`, `--logo-mid`, `--logo-bottom`), with a lit edge above the letters and a shadow below (`--logo-lit`, `--logo-shade`). It uses `filter: drop-shadow`, because `text-shadow` does not follow a gradient fill. The name is set in Poppins SemiBold. Next to it is the logo mark (`components/LogoMark.tsx`), a tilted square next to a wide frame (a prompt and a screen) in a blue-to-teal gradient, the same picture as the favicon.
- **Controls.** One look for every choice list (a fixed arrow, so it is the same in every browser), sliders with a track filled up to the thumb (`--fill` is set from the value in `SettingControls.tsx`), switches with a soft thumb shadow, and the one filled button with a glossy gradient.
- **Focus.** Keyboard focus is always visible: a 2 px ring in `--ring` on buttons, choice lists, inputs and links, shown for the keyboard and not for a mouse click.
- **Dialogs.** The page behind a dialog is dimmed and softened (`backdrop-filter`).

The browser's tab colour follows the theme (`theme-color` in `index.html`).

### 5.14 Theme

The theme is chosen with the _Dark mode_ switch or the T key. `data-theme` on `<html>` decides. All colour in `app.css` is tokens (`--bg`, `--accent`, `--frame-red`, `--bubble-bg` …) that the light theme overrides. Monaco gets `vs-dark` or `vs`. One choice controls both the page and the stage.

### 5.15 Version and build time

The version is read from `package.json` and shown as major.minor (`v1.0`; the patch number is left out), and the time from the clock when Vite builds (`define` in `vite.config.ts`). They are shown in the status bar and in Guide → About. The build time is shown as `yymmdd.hhmm` (for example `261104.1932`), so two builds of the same version still differ.

## 6. Quality

- `npm run check` runs the type check, ESLint, Prettier, TypeDoc and the tests. The same command runs in GitHub Actions (`.github/workflows/ci.yml`) on every push and pull request, and in `deploy-vps.sh` before every manual upload. The workflow only checks; it never deploys.
- Comments in the code are TSDoc (`/** … */` with `@param` and `{@link …}`). TypeDoc turns them into API documentation with `npm run docs`, and is set up so an exported function, type or component without documentation is an error.
- `package.json` has an `overrides` entry for `dompurify`. Monaco 0.57 pins DOMPurify to exactly 3.4.15, which has known security holes. `overrides` forces the fixed 3.4.17 instead. It can be removed when a new Monaco version pulls in a fixed DOMPurify; `npm audit` shows when.
- Never run `npm audit fix --force` without reading what it does. Here it wanted to roll Monaco back to 0.56, which has different export paths, and the app would stop building.

## 7. Deployment and security

The app is a static site: `dist/` is everything. It is hosted on a VPS: Coolify (with Railpack) builds it on every push to `main` and serves it from an `nginx:alpine` container behind Traefik, which handles HTTPS. It can also be hosted by hand behind nginx (`npm run deploy:vps`). See [DEPLOY.md](DEPLOY.md).

On the VPS, nginx sends security headers from `deploy/nginx/security-headers.conf`, including a Content Security Policy. Hashed files under `/assets/` are cached for a year; everything else, including `index.html`, is checked on every visit, so visitors never run an old version after an upload.

## 8. Known limitations

- Multi-line block comments and multi-line strings (Python `"""`, template literals) are typed as ordinary code and do not become bubbles.
- Many comments close together can push bubbles below the bottom of the stage.
- A mouse click does not hit the right place in Monaco when the stage is scaled down, but that does not matter because the mouse is not used against the code.
- The portrait stage is recorded at reduced sharpness on a 1080p screen (see section 5.10).
- `files/files.ts` (a helper for saving files in the browser) is currently unused. Import and export of settings were removed, because with everything visible in the panel it is faster to set things up than to find a file.
