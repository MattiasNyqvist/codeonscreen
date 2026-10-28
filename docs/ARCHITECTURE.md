# Code On Screen – arkitektur

Code On Screen är en scen, inte en editor. Monaco används för att _rita_ kod så att den ser ut som VS Code, men på scenen skriver ingen människa. All text kommer från en motor som trycker tangenter på en timer. Nästan varje beslut nedan följer av den skillnaden.

## Två vyer

**Startsidan** läses uppifrån och ned och ska klara femsekunderstestet utan att någon dialog behövs.

Överst ligger **huvudraden**: loggan _Code On Screen_ med taglinen _Don't just type your code. Present it._ under. Till höger finns två strömbrytare, **Help text** och **Dark mode**, sedan **Guide** – en riktig knapp med en bokikon, eftersom det är dit en nybörjare som kört fast går – och längst ut den blå knappen **▶ Start Presentation Mode**. Knappen är länkblå med vit text: den är sidans enda huvudhandling, och blått är färgen för "gå vidare". Huvudraden är 72 px hög och mörkare än panelen, så att den syns som ett eget band och en riktig logga får plats senare.

Under den ligger **kontrollpanelen**, ett dragspel (accordion) vars egen titelrad öppnar och stänger den. Överst står vad appen gör, på två rader: _Turn your code into a scripted presentation._ och _Automatic typing, highlights and pauses – written right in your comments._ Ordet _video_ står ingenstans i appen utom i guiden: appen presenterar, och inspelning är bara ett av användningsområdena. Därunder ligger fyra rutor, som kanaler på ett mixerbord, med nummer och en rubrik som börjar med ett verb – rutorna är stegen i en process. (Två försök att binda ihop dem med en blå tunnelbanelinje – först längs rutornas överkant, sedan som stationer ovanför – gjorde varken sidan snyggare eller processen tydligare och togs bort. Numren räcker.)

1. **Add your code** – _Paste your code in the **box below**_ (den enda anvisningen som syns även när hjälptexten är av, eftersom sidan annars saknar en startpunkt), _Show code as_ (språket), huvudreglaget _Presentation commands_ och under det en rad per kommando (se _Manus i koden_ nedan).
2. **Set up typing** – _Typing speed_, direkt följd av **Preview** som skriver första raden av din kod med de valda inställningarna, sedan _Keystroke sound_, _Make typos and fix them_ och _Show line numbers_. Rutan bredvid Preview säger _Press Preview to try it_ så länge den är tom. Reglagen visar inga siffror – Preview visar hastigheten bättre än "30/s" – och alla etiketter har samma bredd, så att reglagen står i en rak lodrät linje. Bara ljudet har kvar en högtalare i en fast ruta efter reglaget.
3. **Choose the look** – 16:9 eller 9:16 med en rad om vad formatet är till för (helskärm eller inspelning med OBS), och under en linje _Highlight color_, _Pointer style_ och _Spotlight size_. Allt som bestämmer hur skärmen ser ut ställs in här, före start. Färgen och pekaren låg först i ruta 4, men spotlightens storlek går inte att ändra under presentationen, och färg och pekare väljer man oftast innan. R, G, B, M och P byter dem fortfarande live, och verktygstipsen säger det. Ruta 2 heter _Set up typing_ och inte _Set playback_: "playback" är ordet för Space i ruta 4.
4. **Present** – tangenterna **Space** och **Esc**, som alltid syns, länken _View all shortcuts_ till guidens tangentlista, och en rad om att klicka på den blå knappen när man är klar. Ruta 4 är sista steget: hur man presenterar, och vägen in.

Varje kontroll förklarar sig i ett **verktygstips** när man pekar på den eller tabbar dit. Det fanns tidigare en fast hint-rad under rutorna, men den tog en hel rad av sidan och var en bit från det den förklarade.

Sist kommer **rutan med din kod** (en Monaco-editor). I dess övre högra hörn står valt språk i diskret grått – bara här, aldrig i Presentation Mode, som har en egen editor. Den ligger under en rad som säger _Your code – paste or write what you will present_, med knapparna **Load example code** (ifylld, den inbjudande) och **Clear code** (tonad, eftersom den kastar kod). Gränssnittet namnger rutan efter vad som står i den, _your code_, och inte efter verktyget. _Textarea_ är ett HTML-ord som en lärare inte använder, och _code editor_ lovar mer än en ruta att klistra in i. Clear code frågar först, eftersom koden inte finns någon annanstans. Raden där markören står får ingen ram: de grå etiketterna räcker att titta på. Första gången sidan öppnas ligger exemplet redan i editorn. Längst ned finns en statusrad med _by Nyqvist_, version, byggtid och copyright.

**Manus i koden.** En kommentar kan innehålla ett kommando, och då styr den presentationen. I gränssnittet heter de _presentation commands_; i koden heter de markörer (`marker`), och inställningen heter fortfarande `scriptMarkers`.

| Markör           | Vad som händer                                                                 |
| ---------------- | ------------------------------------------------------------------------------ |
| `@@callout Text` | En pratbubbla vid nästa rad                                                    |
| `@@highlight`    | Highlight-rutan ritas runt nästa rad när den är skriven, och skrivandet pausar |
| `@@pause`        | Skrivandet pausar efter nästa rad                                              |
| `@@step Rubrik`  | En stegrubrik bredvid filnamnet, från nästa rad tills nästa steg               |

**Markören hittas likadant i alla språk.** Sökningen letar efter `@@` följt av ett ord och bryr sig inte om kommentarssyntaxen, så `// @@pause`, `# @@pause` och `<!-- @@pause -->` fungerar lika. Dubbla `@` är det som gör det säkert. Med ett enda `@` krockade markörerna med riktig kod: `@step` är en dekorator i Python och ett tillåtet variabelnamn i C#. `@@step` är giltig kod i inget av appens elva språk. Två undantag är inbyggda: `@@` direkt efter en bokstav räknas inte (Razor skriver `info@@example.com`), och inte heller `@@` följt av mellanslag (rubriken i en diff, `@@ -1,3 +1,4 @@`).

**En rad med en markör skrivs aldrig ut** – hela raden, oavsett vad mer som står på den, oavsett om markören är på eller av, och även när ordet efter `@@` är felstavat. Ett felstavat `@@calout` gör ingenting, men det hamnar heller inte i inspelningen. Därför hör varje markör till _nästa_ rad med kod; markörer i slutet av en kodrad finns inte längre. Textarean varnar om en markör döljer kod på samma rad, och om ett ord efter `@@` inte är en markör.

Text efter `@@highlight` eller `@@pause` blir också en bubbla. **En kommentar utan markör är vanlig kod och skrivs alltid ut.** Huvudreglaget _Presentation commands_ slår på eller av hela manuset. Under det hänger en rad per kommando med reglage, namn och vad det gör med två eller tre ord – _Speech bubble_, _Typing pause_, _Highlight & pause_, _Step title_ – även med hjälptexten av; verktygstipset har hela meningen. Namnen står en gång, inte i en extra lista. När huvudreglaget är av blir markörraderna bleka och reglagen visas som av, eftersom det är vad de är; var och en minns sitt läge tills huvudreglaget slås på igen. Med hjälptext på förklarar en anteckning under raderna principen, med ett exempel i det valda språkets kommentarssyntax: _A comment with @@, like `# @@pause`, acts on the line below it and is never shown itself. Other comments are typed as code._

Exemplet använder alla markörer och en vanlig kommentar, så den första tagningen visar både manuset och att en kommentar utan markör skrivs ut. Kodrutan visar vad varje markörrad gör med en etikett efter raden – en ikon och kommandots namn, till exempel _callout_ med en pratbubbla – så manuset går att läsa direkt i koden. Etiketten är i kommentarernas gulgröna ton, ett snäpp ljusare, så att den hör ihop med kommentarerna men ändå syns som något annat. Själva kommandoraden är limegrön: kommentarer är matt gröna och koden har många färger, och lime är ingetdera, så en rad som aldrig visas sticker ut som en sådan. I ljust läge ligger en mörk lime för nära kommentarernas gröna, så där får raden också en ljus limebakgrund. **Ikonerna** är enkla konturer utan fyllning: en pratbubbla (callout), pausknappens två streck (pause), en ruta runt en rad (highlight) och ett bokmärke (step). De ersatte emojier, som inte går att färga och som var för små för att läsas; bokmärkesemojin såg ingen som ett bokmärke, och `§` före den förknippade ingen med ett steg. Samma ikoner står efter varje kommandos beskrivning i kontrollpanelen, så att panelen och koden hör ihop. Sökvägarna finns på ett ställe, `components/CommandIcon.tsx`. I panelen ritas de som SVG; i kodrutan, där Monaco bara tar emot text och klassnamn, är en ikon två hårda mellanslag som målas med ikonen som CSS-mask. Pausen och rutan använder samma mekanik som tangenten H: `usePresenter` anropar `pauseAtLineEnd()` när raden är klar, innan radbrytningen skrivs. **Steg** (`@@step`) visas i flikraden, bredvid filnamnet, som VS Code:s sökvägsrad: `Program.cs › Add VAT`. Där skymmer rubriken aldrig koden, den fungerar i både 16:9 och 9:16, och ingenting flyttar sig när den byts. En stegrubrik är aldrig en bubbla – bubblor förklarar en rad, steget säger vad avsnittet handlar om.

Inställningarna är `scriptMarkers` (huvudreglaget) och `markers` (ett ja/nej per markör). Varje markörs reglage läses för sig, så ett trasigt värde aldrig slår av de andra. Äldre versioners `commentsAsCallouts` och `commentMode` ignoreras: med den nya regeln finns inga "vanliga kommentarer som bubblor" längre. Markörerna hette först `@callout` och så vidare, med ett `@`; `@@step` hette en kort tid `@chapter`.

**Samma ord överallt.** Panelen, verktygstipsen och guiden använder exakt samma termer: _your code_, _Show code as_, _Presentation commands_, _callouts_, _Typing speed_, _Preview_, _Keystroke sound_, _Show line numbers_, _Highlight color_, _Pointer style_, _Presentation Mode_ och _New start_.

**Exemplet** är en liten, realistisk tutorial – en varukorg där priser summeras och moms läggs på – och kommentarerna är riktiga utvecklarkommentarer: varför `decimal` och inte `double`, var `Sum()` kommer ifrån, vad `:F2` gör. Bubblorna får vara upp till 720 px breda, så att en vanlig kommentar ryms på en rad; högre bubblor knuffar varandra nedåt och skymmer koden. Varje kommentar blir en callout, så exemplet visar hur en färdig tutorial ser ut. Tangenterna lär panelen ut, inte exemplet.

**Help text** är till för att nybörjaren ska få förklaringar och den vane ska få tillbaka utrymmet. Avslaget göms allt som bara förklarar: meningen överst i panelen, anteckningarna i rutorna, verktygstipsen och tipsen när Presentation Mode öppnas. Det som behövs för att använda appen står kvar: första anvisningen, kommandonas korta beskrivningar och Space och Esc. Läget sparas i webbläsaren och är på för nya besökare. Rutorna får ingen fast minsta höjd: att panelen krymper när man själv slår av hjälptexten är just det man bad om, och en fast höjd skulle ge den vane tomma rutor.

**Namnval och skälen till dem.** _Presentation Mode_ i stället för Tutorial Mode, och _Presentation format_ i stället för Video format, eftersom appen presenterar – det är OBS som spelar in. _Show code as_ i stället för Language, som också kan betyda svenska eller engelska – och etiketten säger vad valet gör. _As callouts / As code comments_ är två namngivna knappar i stället för en strömbrytare, eftersom en strömbrytare inte säger vad "av" betyder. _Guide_ i stället för Help. Import och export av inställningar är borttagna: med allt synligt i panelen är det snabbare att ställa in än att leta upp en fil.

**Verktygstipsen** är skrivna för någon som aldrig sett appen: vad kontrollen gör, med vanliga ord. Texterna ligger som data i `models/controlHints.ts`, och ett test ser till att ingen blir för lång. Kopplingen sker med _event delegation_ i `useHoverHint`: lyssnare på behållaren läser `data-hint` från närmaste markerade element och ger tillbaka både id:t och elementet. `HintTooltip` mäter elementet och lägger tipset under det, eller över om det inte får plats, i `document.body` så att ingen ruta klipper det. Tipset tonar in efter en kort stund, så att det inte blinkar tips vid varje kontroll när musen sveper över panelen. Det tidigare välkomstintrot, där hint-radens ram ritades upp, försvann med hint-raden. **Varje tangent ritas likadant överallt**, som en tangentruta (`<kbd>`) med samma utseende som i guidens tangentlista; texterna skriver tangenter inom hakparenteser, `[Space]`, och `KeyText` ritar dem.

Editorn visar själv vad som kommer att hända: varje kommandorad får en etikett med ikon och namn. Etiketterna är Monaco-dekorationer med injicerad text, så de är inte en del av koden.

**Presentation Mode** är det enda som spelas in. Den är exakt 1920×1080 i 16:9 och 1080×1920 i 9:16, centrerad och nedskalad bara om fönstret är mindre. Den har inga knappar, och musen kan inte påverka koden, bara flytta pekaren. Vid varje start visas _Press Space to start · Press Esc to leave Presentation Mode_ och, mindre, _Switch off Help text to hide these tips_ i ungefär två och en halv sekund och tonar sedan ut, så att texten är borta innan man trycker på inspelning i OBS. Med hjälptexten av visas de inte alls. Esc lämnar Presentation Mode; N (new start) börjar om tagningen. Den blå knappen är enda vägen in – P betyder Pointer.

Ingen dialog öppnas någonsin i Presentation Mode. Den kan alltså inte hamna i en inspelning, och ingen dialog kan ligga under en spotlight utan synlig muspekare.

**Version och byggtid** läses från `package.json` och klockan när Vite bygger (`define` i `vite.config.ts`). De syns i statusraden och i Guide → About.

**Namn i gränssnittet och i koden.** Användaren ser _Presentation Mode_, _callout_ och _highlight_. I koden heter samma saker `stage`, `hint`/`bubble` och `frame`, eftersom de namnen beskriver vad som ritas. Gränssnittets ord kan ändras utan att koden behöver byta namn.

## Lagren

```text
components  →  hooks  →  engine · source · hints · frame · editor · audio  →  models
```

Beroenden pekar bara åt höger. `models` importerar ingenting. `engine` vet inte att React eller Monaco finns. Det är därför motorn, källkodsförberedelsen, lästiden, ramlogiken och kameramatematiken går att testa med vanliga funktionsanrop, utan webbläsare. Testerna täcker dem. Komponenterna har inga tester; de är tunna med flit.

| Mapp          | Ansvar                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `models/`     | Typer och konstanter: språk, inställningar, ram, tangenttryck, uppspelningsläge                 |
| `engine/`     | Skrivmotorn: källkod → chunkar → tangenttryck (med stavfel) → timer                             |
| `source/`     | Förbereder källkoden: kommentarer som lyfts ut till bubblor, raden som förhandsvisas            |
| `hints/`      | Bubblornas lästid och utfasning                                                                 |
| `frame/`      | Radlogik för ramen: vilken rad den växer till, vilka rader som tonas ner                        |
| `editor/`     | Allt Monaco-nära: inläsning, inställningar, pixelgeometri, kamera, bubbelstapling               |
| `audio/`      | Syntetiserade tangentljud                                                                       |
| `hooks/`      | Limmet mot React: `usePresenter` (scenen), `useTypewriter` (motorn), inställningar, tangentbord |
| `components/` | `setup/`, `dialogs/` och `stage/` – presentation, nästan ingen logik                            |

## Vem gör vad

`App` äger inställningarna, vilken vy som visas och tangentbordskartan. Den är medvetet kort.

`usePresenter` äger allt som händer på scenen och returnerar ett `Presenter`-objekt: tillstånd att rita (`frame`, `hints`, `zoomRange` …) och en funktion per tangent (`togglePlay`, `stop`, `frameOrGrow`, `toggleZoom`). Vill du förstå vad en tangent gör på scenen är det här du läser.

`CodeStage` är den enda komponenten som rör scenens Monaco. Utåt erbjuder den ett litet handtag via `ref` (`append`, `backspace`, `clear`, `focus`, `getLastLine`, `isLineBlank`). Allt annat går in som props.

## Inställningar

Alla inställningar är ett enda objekt av typen `Settings` som sparas i `localStorage` under nyckeln `code-on-screen.settings`. `parseSettings` validerar fält för fält när de läses in. Ett felaktigt värde, till exempel en färg från en äldre version, faller tillbaka på sitt standardvärde utan att resten går förlorat. Den funktionen är ren och testad.

## Monaco

`@monaco-editor/react` hämtar som standard Monaco från en CDN. `monacoSetup.ts` pekar om den till `node_modules`, så att allt fungerar offline.

Vi laddar inte hela Monaco. `editor.api` är editorn utan språk, och sedan registreras bara de elva språken appen erbjuder. Tio av dem är Monarch-tokenizers, ren färgkodning utan språktjänst. JSON finns bara som full språktjänst och tar med sig en egen worker. Resultatet är 5,3 MB i stället för 12. TypeScripts språktjänst på 7 MB försvann helt, och den användes ändå aldrig eftersom felmarkeringarna är avstängda.

Scenens editor är inte `readOnly`, för då slutar markören blinka. Den är `domReadOnly`: tangentbordet är blockerat men markören lever. Ligaturer är avstängda i båda editorerna. En nybörjare som ser `=>` bli en pil vet inte vilka tangenter hen ska trycka.

Typsnittet JetBrains Mono följer med i bygget via `@fontsource`, så alla datorer spelar in samma typsnitt. Monaco mäter teckenbredden en gång, och därför mäter `monacoSetup` om när typsnittet har laddats.

## Skrivmotorn

Källkoden går genom tre steg innan något syns:

1. `tokenize` delar upp den i chunkar. Varje tecken blir en chunk, utom indrag som blir en enda chunk, eftersom en människa trycker Tab en gång.
2. `planKeystrokes` gör om chunkarna till `Keystroke`-objekt: `{ kind: 'type', text }` eller `{ kind: 'backspace' }`. Med stavfel påslaget blir ungefär 1,2 % av bokstäverna mitt i ett ord fel. En granntangent på tangentbordet trycks, följt av backsteg och sedan rätt bokstav. Slumpfunktionen skickas in som parameter, så testerna kan bestämma exakt vad som händer.
3. `Typewriter` utför tangenttrycken med `setTimeout`. `timing` ger varje tryck en väntetid: grundtakt, ±35 % slump, ×5 före radbrytning, ×1,8 före `; { } ( ) , >` och ×4 före ett backsteg, för att det ska se ut som att personen hinner se felet.

Motorn skickar ut händelser: `onType`, `onBackspace`, `onReset`, `onStateChange`, `onKeystroke` (ljud), `onLineComplete` (bubblor) och `onLineEndPause` (H). Den skapas en gång i `useTypewriter`. En effekt kopplar den efter varje rendering via `connect()`, så att den alltid anropar de senaste callbackarna och aldrig läser en ref under rendering.

## Ramen (H)

H ramar in raden som skrivs just nu, direkt, medan resten av raden fortsätter att skrivas in i ramen. Typsnittet är monospace, så slutbredden är känd i förväg. `usePresenter` slår upp radens färdiga text och skickar den som `typingLine`. `geometry.ts` räknar sedan bredden från texten (`textColumns`, tabbar inräknade) gånger teckenbredden. När raden är klar pausar motorn (`pauseAtLineEnd`). H igen växer ramen uppåt till närmaste rad med innehåll. Space tar bort den och fortsätter.

Ramen ritas medurs, en sida per 250 ms. Det är ren CSS: fyra kanter som skalas från 0 till 1 med olika fördröjning (`.frame-outline` i `app.css`). Monaco-dekorationer går inte att animera, och därför är ramen ett eget element. Ramen ligger inuti kameran, så den zoomar med koden. När uppspelningen står still tonas raderna utanför ramen ner till 35 %.

## Zoom (Z)

Kameran är en transform (`translate + scale`) på ett element runt Monaco. `camera.ts` räknar ut målet: högst 1,6×, högst 85 % av ytan, centrerat, och med kanterna klämda så att kameran aldrig visar tomrum. Rörelsen drivs med `requestAnimationFrame` under 450 ms, inte med en CSS-transition. Bubblorna ligger nämligen utanför kameran, så att texten i dem behåller sin storlek, men de måste ändå följa sin rad. När JavaScript driver kameran kan bubblorna flyttas i samma bildruta.

## Bubblor

`extractScript` lyfter ut markörraderna innan uppspelningen, och varje markör hör till nästa rad med kod. Bubblan visas när raden är färdigskriven. Den står kvar i `1,5 s + 1 s per 12 tecken`, minst 3 och högst 10 sekunder, och tonar sedan ut. Klockan går även under pauser: en bubbla finns till för att läsas, och läsandet stannar inte för att skrivandet gör det. Tidigare frös en paus alla bubblor, och eftersom exemplet pausar vid `@@highlight` innan de första bubblorna hunnit ta slut tonade de aldrig ut. Bara bubblan på raden där pausen väntar behåller sin tid – det är den raden man pratar om. I liggande format sitter bubblan fem teckenbredder efter sista tecknet på sin rad, med en pil som pekar på raden. `bubbleLeft` flyttar in den från kanten om raden är så lång att bubblan inte får plats, eftersom en bubbla över lite kod är bättre än en bubbla som klipps. `stackBubbles` ser till att bubblor på närliggande rader inte överlappar och flyttar pilen om en bubbla har knuffats ner. En längre rad nedanför kan hamna under en bubbla; det är priset för att bubblan sitter vid sin rad, och utfasningen gör att det sällan varar länge.

## Format: liggande och stående

`models/stageFormat.ts` samlar allt som skiljer formaten åt i `STAGE_LAYOUTS`: storlek, textstorlek, radhöjd och var bubblorna hamnar. Inget annat i koden behöver veta vilket format som är valt; det läser sin layout därifrån.

Stående format är mer än ett annat mått. En 9:16-film visas runt 400 punkter bred på en telefon, alltså en knapp tredjedel av 1080 pixlar. Därför är koden 30 px i stället för 20, vilket ger plats för ungefär 50 tecken per rad. Bubblor efter radslutet skulle nästan alltid hamna utanför kanten, så bubblorna blir textremsor i ett eget fält under koden. Längst ner lämnas 300 px tomt och till höger 140 px fritt i textremsan, eftersom TikTok och Reels lägger namn, beskrivning och knappar där.

Den stående scenen är 1920 px hög, mer än en 1080p-skärm. Där skalas den ner och spelas in med ungefär halva skärpan. Det kan appen inte lösa; hjälpen säger det rakt ut och föreslår större skärm eller en skärm på högkant.

## Små lägen som sparas

Om Space har tryckts någon gång, om kontrollpanelen är öppen och om hjälptexten är på sparas med `useStoredFlag`, en `useState` som också skriver till `localStorage`.

## Dialoger

Guiden bygger på `Modal`, som använder HTML:s inbyggda `<dialog>` och `showModal()`. Webbläsaren sköter bakgrunden som spärrar sidan, fokus som stannar i dialogen, Esc och rollerna för skärmläsare. React bestämmer bara om dialogen är öppen; en effekt anropar `showModal()` eller `close()`. Dialogens `close`-händelse håller React i takt när webbläsaren själv stänger den med Esc. Ett klick på bakgrunden träffar själva `<dialog>`-elementet och aldrig innehållet, och det är så ett klick utanför känns igen.

Medan en dialog är öppen får `useKeyboardShortcuts` en tom tangentkarta. Annars skulle `T` byta tema och `P` byta pekare bakom dialogen.

Tangentlistan i hjälpen är data (`SHORTCUT_GROUPS` i `HelpDialog.tsx`), skild från själva bindningarna i `App.tsx`. Ändrar du en tangent måste du alltså ändra på två ställen. Det är ett medvetet val: att generera hjälptexten från bindningarna hade krävt att varje bindning bar sin egen beskrivning, och det är mer maskineri än tio tangenter är värda.

## Ramfärg och mix (R, G, B, M)

I gränssnittet heter ramen **highlight**, eftersom det är vad användaren gör. I koden heter den `frame`, eftersom det beskriver vad som ritas.

Inställningen `frameColor` är en `FrameColorChoice`: en av färgerna eller `mix`. `pickFrameColor` i `frame/colors.ts` gör om valet till en färg varje gång en ny ram ritas. Med mix slumpas färgen bland dem som skiljer sig från förra ramen. Ren slump gav ibland samma färg två gånger i rad, och då ser en ny ram ut som ingenting. Tangenterna är första bokstaven i varje val, så M kom på köpet när `mix` lades till i listan.

## Pekaren (P)

`PointerOverlay` lyssnar på musrörelser och skriver positionen till CSS-variabler, utan någon React-rendering per rörelse. Positionen räknas om till scenens koordinater, eftersom scenen kan vara nedskalad. Lasern är en lysande prick. Spotlighten är en radiell gradient som mörkar allt utom en cirkel. Radien kommer från inställningen `spotlightRadius` (60–300 px, standard 112) via CSS-variabeln `--spotlight-radius`, och den mjuka kanten är 27 % av radien, så stora och små spotlights ser likadana ut. I ljust tema mörkar den mindre, eftersom en mörk slöja över vit bakgrund blir hård. Båda tonar ut 1,5 sekunder efter att musen stannat, och systemets muspekare göms så att det inte blir två pekare i bild.

## Tema

Temat väljs med strömbrytaren _Dark mode_ eller tangenten T. `data-theme` på `<html>` styr. All färg i `app.css` är tokens (`--bg`, `--frame-red`, `--bubble-bg` …) som det ljusa temat skriver över. Monaco får `vs-dark` eller `vs`. Ett val styr både sidan och scenen.

## Kvalitet och dokumentation

`package.json` har en `overrides`-post för `dompurify`. Monaco 0.57 låser DOMPurify till exakt 3.4.15, som har kända säkerhetshål. `overrides` tvingar in den rättade 3.4.17 i stället. Det är bara en patch-version upp, så Monaco märker ingen skillnad. Posten kan tas bort när en ny Monaco-version själv drar in en rättad DOMPurify; `npm audit` visar när det är dags.

Kör aldrig `npm audit fix --force` utan att läsa vad det gör. Här ville det backa Monaco till 0.56, som har andra exportvägar, och då slutar appen att bygga.

`npm run check` kör typkontroll, ESLint, Prettier, TypeDoc och testerna. Samma kommando körs i GitHub Actions och i `deploy-vps.sh`, så en trasig commit når aldrig sajten.

Kommentarerna i koden är TSDoc (`/** … */` med `@param`, `{@link …}`). TypeDoc gör dem till en API-dokumentation med `npm run docs`. Den är inställd så att en exporterad funktion, typ eller komponent utan dokumentation ger ett fel. Enskilda fält behöver ingen kommentar om namnet säger allt.

## Kända begränsningar

Kommentarer i block över flera rader och strängar över flera rader (Python `"""`, template literals) skrivs ut som vanlig kod och blir inga bubblor. Många kommentarer tätt efter varandra kan trycka bubblor nedanför scenens nederkant. Ett musklick träffar inte rätt i Monaco när scenen är nedskalad, men det spelar ingen roll eftersom musen inte används mot koden.
