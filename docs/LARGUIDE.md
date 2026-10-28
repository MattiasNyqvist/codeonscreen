# Lärguide: läs Code On Screen inifrån och ut

Läs koden i den här ordningen. Den börjar där inget beror på något annat och slutar där allt kopplas ihop. Varje steg säger vilka filer det gäller, vad du ska titta efter och vad du ska kunna svara på efteråt. Kör `npm test -- --watch` i en terminal medan du läser. Ändra något, se ett test bli rött och ändra tillbaka. Det lär dig mer än att bara läsa.

Räkna med åtta till tio pass. Steg 3 och 6 är de tyngsta.

## 1. Modellerna – `src/models/`

Börja här, eftersom allt annat använder de här typerna. Läs `keystroke.ts`, `frame.ts`, `playback.ts`, `language.ts`, `stageFormat.ts`, `settings.ts` och sist `controlHints.ts` och `keyText.ts`.

Titta efter mönstret `as const` följt av en härledd typ: `FRAME_COLORS` blir `FrameColor` och `LANGUAGES` blir `LanguageId`. Listan är den enda källan; typen följer med automatiskt. Titta också på `Keystroke`, en _discriminated union_ där fältet `kind` avgör vilka andra fält som finns.

I `settings.ts` är `parseSettings` värd tio minuter. Den tar emot `unknown`, alltså vad som helst från `localStorage`, och returnerar garanterat giltiga inställningar.

**Kontrollfrågor**

- Varför är `PlaybackState` en strängunion och inte fyra booleans?
- Lägg till `'yellow'` i `FRAME_COLORS`. Vilka filer klagar TypeScript på, och varför just de?
- Vad händer i `parseSettings` om `speed` i lagringen är `"30"`, alltså en sträng?
- `splitKeys` i `keyText.ts` gör om `"Press [H]"` till text och tangenter. Varför är det bättre att skriva tangenterna i texten än att bygga varje hint som JSX?

## 2. Skrivmotorns byggstenar – `src/engine/tokenize.ts`, `timing.ts`, `typos.ts`

Tre rena funktioner. Läs varje fil tillsammans med dess `.test.ts`.

`tokenize` är tolv rader. Lägg märke till `Array.from(text)` i stället för `text.split('')`: den håller ihop emoji. `planKeystrokes` i `typos.ts` tar emot slumpfunktionen som parameter. Det kallas _dependency injection_, och testerna visar varför det lönar sig: `sequence(0, 0)` gör slumpen förutsägbar.

**Kontrollfrågor**

- Varför blir indrag en enda chunk?
- Hur kan testet i `typos.test.ts` veta att det blir just `'w'` när `'e'` skrivs fel?
- Sänk `TYPO_RATE` till 0. Vilket test går fortfarande igenom, och varför?

## 3. Skrivmotorn – `src/engine/typewriter.ts`

Hjärtat. Läs först tillståndsdiagrammet i klasskommentaren. Följ sedan ett anrop till `play()` hela vägen: `planKeystrokes` → `scheduleNext` → `setTimeout` → `perform` → `scheduleNext` igen. Det är en kedja, ingen loop.

Titta särskilt på `completeLine` och fältet `lastCompletedLine`. När du trycker H pausar motorn _vid_ radbrytningen. När uppspelningen fortsätter utförs samma radbrytning igen, och utan vakten skulle bubblan för raden visas två gånger.

Läs sedan `typewriter.test.ts`. `vi.useFakeTimers()` gör att testet styr klockan, så ett test som skriver hela källkoden tar några millisekunder i stället för sekunder.

**Kontrollfrågor**

- Vad är skillnaden mellan `pause()` och `pauseAtLineEnd()` i koden, inte bara i beteendet?
- Varför tar konstruktorn emot `random`?
- Ta bort vakten i `completeLine`. Vilket test blir rött?

## 4. Källkoden förbereds – `src/source/`

`extractScript.ts` går igenom koden rad för rad. Varje rad frågas först: finns det `@@` och ett ord här? Det avgör `readMarkerLine` i `models/script.ts` med ett enda reguljärt uttryck. En rad med markör försvinner ur koden och lämnar sitt besked – en bubbla, en ruta, en paus eller en stegrubrik – i väntan på nästa rad med kod. Alla andra rader stannar. `prepareSource.ts` tar sedan bort tomma rader i början och flyttar alla radnummer med.

Här fanns tidigare en skanner som höll reda på strängar och kommentarstecken för vart och ett av de elva språken. Den behövs inte längre, och det är värt att fundera på varför. Språkets kommentarssyntax används nu bara till två småsaker: att känna igen en rad som _bara_ är en kommentar, och att ta bort ett avslutande `-->` efter en markörtext.

Läs till sist `annotateSource.ts` och `previewLine.ts`. Båda använder `readMarkerLine` i stället för egna regler. Varför är det viktigt att kodrutans etiketter, förhandsvisningen och uppspelningen är överens?

**Kontrollfrågor**

- Mönstret är `(?<![\w@])@@([a-z]+)`. Vad gör den första parentesen, och vilket test går sönder om du tar bort den?
- Varför räcker inte ett enda `@`? Hitta raden i testerna som visar en Python-dekorator.
- En markör hör till _nästa_ rad med kod. Varför får en ren kommentarsrad inte "ta emot" en väntande bubbla? Var i `extractScript` bestäms det?
- En markörrad skrivs aldrig ut – inte ens när markören är avslagen eller felstavad. Varför är det bättre att dölja en felstavad markör än att skriva ut den?
- Varför flyttas radnumren i `prepareSource`, och varför måste highlights och pauser flyttas på samma sätt som bubblorna?
- `@@highlight` och `@@pause` anropar `pauseAtLineEnd()` inifrån `onLineComplete`. Varför stannar motorn då precis i slutet av raden och inte en rad senare? Läs `perform` i `typewriter.ts`.

## 5. Ramen och bubblorna utan React – `src/frame/`, `src/hints/`, `src/editor/stackBubbles.ts`, `camera.ts`, `textMetrics.ts`

Fem små filer med ren logik och ren matematik. `camera.ts` är den svåraste. Rita på papper: en ruta på 1000×600, en rad i mitten, zoom 1,6. Var hamnar radens mitt? Jämför sedan med testet.

**Kontrollfrågor**

- Vad gör klämningen i `focusCamera`? Vad skulle synas utan den?
- `stackBubbles` returnerar placeringar i _samma ordning_ som indatan, fast den sorterar internt. Varför?
- Varför går klockan i `tickHints` bara medan uppspelningen pågår? Var i koden avgörs det?

## 6. React-limmet – `src/hooks/useTypewriter.ts`, `usePresenter.ts`

Här möts motorn och React. Två idéer att förstå i `useTypewriter`:

1. `useState(() => new Typewriter())` skapar motorn _en_ gång. Funktionen körs bara vid första renderingen.
2. `engine.connect({...})` i en effekt kopplar om händelserna efter varje rendering. Motorn anropar därför alltid de senaste callbackarna. Det här är lösningen på problemet med inaktuella closures, och det var ESLints regel `react-hooks/refs` som tvingade fram den.

I `usePresenter` finns en funktion per tangent. Läs `frameOrGrow` noga: den har tre fall.

Titta också på `onLineComplete`. Raden läses _innan_ `setHints` anropas, inte inne i uppdateringsfunktionen. React kan köra uppdateringsfunktionen senare, och då har motorn redan skrivit nästa radbrytning. Just den buggen fanns i en tidigare version: den första callouten hamnade rätt och alla andra en rad för långt ned. En uppdateringsfunktion ska bara räkna med `current` och värden som redan är fångade, aldrig läsa något som ändras utanför React.

**Kontrollfrågor**

- Vad händer om du skapar motorn med `new Typewriter()` direkt i komponentkroppen, utan `useState`?
- Varför sätts `typingLine` till `null` i `onLineEndPause`?
- Varför hamnade bara den _första_ callouten rätt när `lastLine()` lästes inne i uppdateringsfunktionen? (Ledtråd: React kör ibland uppdateringen direkt när kön är tom.)
- `Presenter` är en uttrycklig typ. Vad vinner du på det jämfört med att låta TypeScript härleda returtypen?

## 7. Monaco och scenen – `src/editor/monacoSetup.ts`, `editorOptions.ts`, `geometry.ts`, `src/components/stage/`

`monacoSetup.ts` först: varför `editor.api` och inte `monaco-editor`? Läs sedan `CodeStage.tsx`. Den är lång, men den har bara tre jobb: Monaco, ett handtag utåt (`useImperativeHandle`) och `layoutOverlays`, som placerar ram och bubblor.

Lägg märke till att positioner skrivs direkt till `element.style` och inte via React-state. De ändras vid varje scroll och varje bildruta i zoomen, och en React-rendering per bildruta vore slöseri.

`PointerOverlay.tsx` använder samma idé med CSS-variabler.

**Kontrollfrågor**

- Varför är scenens editor `domReadOnly` och inte `readOnly`?
- Ramen ligger _inuti_ kameran men bubblorna _utanför_. Vad skulle hända om båda låg inuti?
- Varför drivs zoomen med `requestAnimationFrame` och inte med en CSS-transition?

## 8. Ihopkopplingen – `src/App.tsx`, `src/hooks/`, `src/components/setup/`, `src/components/dialogs/`

`App` ska nu kännas enkel. Titta på hur tangentbordskartan byggs: `settingKeys` gäller överallt, `stageKeys` bara på scenen, `setupKeys` bara på inställningssidan, och ingenting alls medan en dialog är öppen. I `useKeyboardShortcuts` avgör `isTypingTarget` när genvägar ska ignoreras, och attributet `data-keyboard-surface` är undantaget.

Läs sedan `ControlPanel.tsx`, `useHoverHint.ts` och `HintTooltip.tsx` tillsammans. Verktygstipsen bygger på _event delegation_: panelen har inga lyssnare per kontroll, bara en uppsättning på behållaren som letar upp närmaste `data-hint` med `closest()`. Lägg märke till att `onFocus` och `onBlur` finns med, så att tipsen fungerar med Tab och inte bara med musen. `HintTooltip` mäter kontrollen i `useLayoutEffect` och skriver positionen direkt på elementet, före första bilden – utan en extra rendering. Titta också på `TypingPreview.tsx`: förhandsvisningen återanvänder samma `useTypewriter` som Presentation Mode, men skriver till en vanlig `<code>`-tagg i stället för Monaco. Det fungerar eftersom motorn bara känner till gränssnittet `TypingTarget`. Titta till sist på `useStoredFlag`, en liten hook som håller `App` kort.

Läs sist `Modal.tsx` och `HelpDialog.tsx`. `Modal` är kort, eftersom webbläsarens `<dialog>` gör det mesta. Lägg märke till att React inte kan öppna en modal dialog med ett attribut. Det måste ske med ett anrop, `showModal()`, och därför sköts det i en effekt.

**Kontrollfrågor**

- Varför används `useLayoutEffect` och inte `useEffect` i `HintTooltip`? Vad skulle användaren se med `useEffect`?
- `HintTooltip` renderas med `createPortal` till `document.body`. Vad kan hända med ett `position: fixed`-element som ligger inne i en förälder med `transform`?
- `useHoverHint` behåller samma objekt när musen rör sig inom samma kontroll. Vad skulle hända med tipsets intoning annars?
- `splitKeys` använder ett reguljärt uttryck med flaggan `g` och `matchAll`. Vad skulle hända med `[a b]` om mönstret tillät mellanslag?
- Lägg till en ny kontroll i panelen. Vilka två filer behöver du ändra för att den ska få ett verktygstips?
- Var kommer `__APP_VERSION__` ifrån, och varför står den inte direkt i `app.ts`?
- Varför kan `Modal` inte bara sätta attributet `open={isOpen}` på `<dialog>`?
- Hur vet `Modal` att ett klick hamnade utanför dialogen?

- Varför registreras lyssnaren i _capture_-fasen?
- Du skriver `h` i källkodseditorn på inställningssidan. Följ koden: varför händer ingenting?

## 9. Stilarna – `src/app.css`

Läs tokens överst och sedan `[data-theme='light']`. Byt tema i appen och se vilka variabler som ändras i webbläsarens utvecklarverktyg. Läs sedan `.frame-outline` och räkna fördröjningarna.

**Kontrollfrågor**

- Varför måste `.line-dimmed` vara global CSS?
- Gör ramen snabbare, 0,5 s totalt. Hur många värden behöver du ändra?

## 10. Verktygen och driftsättningen

Läs `package.json` (skripten), `eslint.config.js`, `typedoc.json`, `.github/workflows/deploy-pages.yml` och `scripts/deploy-vps.sh`. Kör `npm run docs` och öppna `docs/api/index.html`. Det är TSDoc-kommentarerna du läst hela vägen, nu som en webbplats.

**Kontrollfrågor**

- Ta bort dokumentationen på en exporterad funktion och kör `npm run check`. Vad händer, och varför är det bra?
- Varför står det en commit-hash efter `uses:` i workflowen och inte bara `@v7`?
- Vad gör `--delete` i rsync, och varför är det ofarligt just här?

## Övningar när du läst allt

Varje övning berör flera lager, och det är meningen.

1. **Lätt:** lägg till Go som tionde språk.
2. **Medel:** gör ramens tjocklek till en inställning, med ett verktygstips.
3. **Medel:** lägg till en fjärde pekare, en ring i stället för en prick.
4. **Svår:** lägg till ett eget demoexempel per språk, som laddas när man byter språk och inte har ändrat koden. Tänk på testet som kontrollerar att exemplets instruktioner blir callouts.
