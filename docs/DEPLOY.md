# Lägga ut Code On Screen

Code On Screen är en statisk sajt. `npm run build` skapar mappen `dist/`, och den mappen är hela appen. Det finns ingen server-kod, ingen databas och ingen Node i drift. Servern ska bara skicka filer.

Bygget använder relativa sökvägar (`base: './'` i `vite.config.ts`). Samma `dist/` fungerar därför på en domänrot (`codeonscreen.dindomän.se`) och i en undermapp (`användare.github.io/code-on-screen/`).

Det här dokumentet tar upp två vägar: GitHub Pages och en egen VPS. Tänk på en sak innan du börjar: en subdomän kan bara peka på ett ställe. Kör du båda behöver de olika adresser, till exempel `codeonscreen.dindomän.se` till VPS:en och GitHubs egen adress för Pages, eller tvärtom.

## Del A – GitHub Pages

Det här är den enkla vägen. GitHub sköter HTTPS, komprimering och servern åt dig.

**1. Lägg upp koden.** Skapa ett repo på GitHub. Med ett gratiskonto måste det vara publikt för att Pages ska fungera. Pusha sedan koden:

```bash
git init
git add .
git commit -m "Code On Screen"
git branch -M main
git remote add origin git@github.com:DITT-NAMN/code-on-screen.git
git push -u origin main
```

**2. Slå på Pages.** I repot: _Settings → Pages → Build and deployment → Source_, välj **GitHub Actions**. Workflowen finns redan i `.github/workflows/deploy-pages.yml`.

**3. Vänta på första körningen.** Under fliken _Actions_ syns körningen: installera, `npm run check`, bygg, publicera. Den tar runt två minuter. Blir den röd har kontrollen hittat något, och felet står i loggen. När den är grön ligger appen på `https://DITT-NAMN.github.io/code-on-screen/`.

Från och med nu publiceras varje push till `main` automatiskt.

**4. Egen subdomän (valfritt).** Lägg till en DNS-post hos den som hanterar din domän:

| Typ   | Namn           | Värde                 |
| ----- | -------------- | --------------------- |
| CNAME | `codeonscreen` | `DITT-NAMN.github.io` |

Skriv sedan `codeonscreen.dindomän.se` under _Settings → Pages → Custom domain_. Vänta tills GitHub har kontrollerat DNS-posten, vilket kan ta från några minuter upp till en timme. Kryssa därefter i **Enforce HTTPS**.

Verifiera också domänen under ditt GitHub-konto (_Settings → Pages → Add a domain_). Annars kan någon annan i teorin ta över subdomänen om ditt repo någon gång tas bort. Det tar fem minuter och stänger den dörren.

## Del B – egen VPS

Här lär du dig drift på riktigt. Appen är det lätta. Det mesta jobbet ligger i att göra servern säker, och det är också den del som är värd att lära sig ordentligt.

Guiden förutsätter Ubuntu LTS (24.04 eller 26.04). De flesta VPS-leverantörer erbjuder det som standardval. Du behöver serverns IP-adress, tillgång till domänens DNS och en Linux-dator med `ssh` och `rsync`.

Genomgående används `codeonscreen.dindomän.se`. Byt ut den mot din egen subdomän.

### 1. En SSH-nyckel på din dator

Har du redan en `~/.ssh/id_ed25519` kan du hoppa över det här steget.

```bash
ssh-keygen -t ed25519 -C "mattias@laptop"
```

Nyckeln ersätter lösenord helt. Lösenordsinloggning stänger vi av i steg 3.

### 2. Första inloggningen och en egen användare

Leverantören har gett dig ett root-lösenord eller lagt in din nyckel. Logga in, uppdatera allt och skapa en vanlig användare. Den heter `deploy` här.

```bash
ssh root@SERVERNS-IP
apt update && apt upgrade -y
adduser deploy
usermod -aG sudo deploy
```

Kopiera din nyckel till den nya användaren. Det görs från din egen dator, i en ny terminal:

```bash
ssh-copy-id deploy@SERVERNS-IP
ssh deploy@SERVERNS-IP        # ska gå in utan lösenord
```

### 3. Lås SSH

Skapa en egen konfigurationsfil i stället för att ändra i huvudfilen. Då överlever ändringen systemuppdateringar.

```bash
sudo tee /etc/ssh/sshd_config.d/99-hardening.conf >/dev/null <<'EOF'
PasswordAuthentication no
PermitRootLogin no
EOF
sudo sshd -t && sudo systemctl reload ssh
```

**Stäng inte terminalen du är inloggad i.** Öppna en ny terminal och testa `ssh deploy@SERVERNS-IP`. Fungerar det kan du stänga den gamla. Fungerar det inte har du fortfarande en öppen session att rätta felet i. Det här är det vanligaste sättet att låsa ute sig själv.

### 4. Brandvägg och automatiska säkerhetsuppdateringar

```bash
sudo apt install -y nginx unattended-upgrades
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'      # port 80 och 443
sudo ufw enable
sudo dpkg-reconfigure -plow unattended-upgrades   # svara Yes
```

Nu är bara SSH och webben öppna, och säkerhetsuppdateringar installeras av sig själva.

### 5. Peka subdomänen mot servern

Hos din DNS-leverantör:

| Typ | Namn           | Värde       |
| --- | -------------- | ----------- |
| A   | `codeonscreen` | SERVERNS-IP |

Har servern även en IPv6-adress lägger du till en `AAAA`-post. Kontrollera från din dator att posten slagit igenom:

```bash
dig +short codeonscreen.dindomän.se
```

Svarar den med serverns IP-adress är du klar. Det kan ta en stund.

### 6. nginx

Skapa mappen som appen ska ligga i och ge `deploy` äganderätt, så att du kan ladda upp utan `sudo`:

```bash
sudo mkdir -p /var/www/code-on-screen
sudo chown deploy:deploy /var/www/code-on-screen
```

Kopiera de två konfigurationsfilerna från repot. Det görs från din dator:

```bash
scp deploy/nginx/code-on-screen.conf deploy/nginx/security-headers.conf deploy@codeonscreen.dindomän.se:~
```

Lägg dem på plats på servern, byt ut domännamnet och slå på sajten:

```bash
sudo mv ~/code-on-screen.conf /etc/nginx/sites-available/
sudo mv ~/security-headers.conf /etc/nginx/snippets/code-on-screen-security.conf
sudo sed -i 's/codeonscreen.example.com/codeonscreen.dindomän.se/' /etc/nginx/sites-available/code-on-screen.conf
sudo ln -s /etc/nginx/sites-available/code-on-screen.conf /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

`nginx -t` testar konfigurationen innan den laddas. Kör alltid det kommandot före `reload`.

Kommentarerna i `code-on-screen.conf` och `security-headers.conf` förklarar varje rad. En detalj är värd att känna till: nginx ärver bara `add_header` från `server`-blocket om `location`-blocket saknar egna. Våra `location`-block sätter `Cache-Control`, så säkerhetshuvudena inkluderas i varje block från en gemensam fil.

### 7. Första uppladdningen

Från din dator, i projektmappen:

```bash
DEPLOY_HOST=deploy@codeonscreen.dindomän.se npm run deploy:vps
```

Skriptet kör `npm run check`, bygger och laddar upp `dist/` med `rsync`. Öppna `http://codeonscreen.dindomän.se`. Appen ska synas, ännu utan HTTPS.

### 8. HTTPS med Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d codeonscreen.dindomän.se
sudo certbot renew --dry-run     # bekräftar att förnyelsen fungerar
```

Certbot lägger till HTTPS i din nginx-konfiguration, skickar HTTP vidare till HTTPS och förnyar certifikatet automatiskt var 60:e dag. Du behöver inte göra något mer.

### 9. Kontrollera

```bash
curl -I https://codeonscreen.dindomän.se/
```

Svaret ska innehålla `Cache-Control: no-cache` och `Content-Security-Policy`. Öppna sedan appen i webbläsaren, slå på utvecklarverktygen (F12) och titta under _Console_. Där ska inte finnas några röda rader om "Content Security Policy". Finns det sådana anger meddelandet vilken resurs som stoppades, och direktivet för den resursen i `security-headers.conf` är det som behöver justeras.

### 10. Uppdatera senare

Samma kommando som i steg 7. Varje uppladdning byter ut alla filer. Gamla filer tas bort (`--delete`), och tack vare cache-reglerna får besökarna den nya versionen vid nästa sidladdning.

### När något går fel

| Symptom                              | Trolig orsak                                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `403 Forbidden`                      | Mappen är tom eller fel ägare. Kör `ls -la /var/www/code-on-screen`                                     |
| Sidan är tom, `404` på `/assets/...` | Snedstrecket saknas efter `dist/` i rsync-kommandot, så filerna hamnade i en undermapp                  |
| Certbot misslyckas                   | DNS-posten har inte slagit igenom än, eller port 80 är stängd i brandväggen                             |
| Gammal version efter uppladdning     | Ladda om med Ctrl+Shift+R. Hjälper inte det: kontrollera att `index.html` har `Cache-Control: no-cache` |
| `Permission denied (publickey)`      | Nyckeln finns inte hos `deploy`. Kör `ssh-copy-id` igen från din dator                                  |
