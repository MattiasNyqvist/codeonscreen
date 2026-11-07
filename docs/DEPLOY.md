# Deploying On Screen

On Screen is a static site. `npm run build` creates the `dist/` folder, and that folder is the whole app. There is no server-side code, no database and no Node process in production. The server only has to hand out files.

The build uses relative paths (`base: './'` in `vite.config.ts`). The same `dist/` therefore works at a domain root (`codeonscreen.yourdomain.com`) and in a sub-folder (`yourdomain.com/code-on-screen/`).

This document covers two ways of hosting the app on a VPS:

- **Coolify with Railpack** – how the app is actually deployed. Coolify builds and publishes it on every push to `main`. Start here.
- **Manual nginx** – the same result without Coolify: you set up the server yourself and upload `dist/` with `rsync`. It is the longer route, but it teaches you what Coolify does for you.

## Coolify with Railpack

The setup: a VPS (Contabo) running Coolify v4, a domain at GoDaddy, and the code on GitHub. Coolify's built-in Traefik proxy gets a free Let's Encrypt certificate for every domain automatically, so there is nothing to configure for HTTPS.

**How a deploy works.** Coolify clones the repository over SSH, [Railpack](https://railpack.com) builds the Vite project into `dist/`, and the result is served by a small `nginx:alpine` container on port 80. Traefik sits in front of it and handles HTTPS.

**1. DNS.** At your DNS provider, point a subdomain at the VPS with an `A` record:

| Type | Name       | Value                |
| ---- | ---------- | -------------------- |
| A    | `onscreen` | the VPS's IP address |

**2. Give Coolify access to the repository.** Coolify uses an SSH key. Add its public key as a _deploy key_ in the GitHub repository (_Settings → Deploy keys_), so Coolify can clone it. A read-only key is enough.

**3. Create the resource.** In Coolify, add a new resource from the repository, on the `main` branch:

- **Build strategy:** Railpack
- **Site type:** Static, with **Web server** `nginx:alpine`. The app is only static files, so it needs no server process.
- **Base directory:** `/`
- **Publish directory:** `/dist`
- **Install command, build command and start command:** leave empty. Railpack detects the Vite project and runs `npm run build` itself.
- **Domain:** `https://onscreen.yourdomain.com` (the subdomain from step 1)
- **Exposed port:** 80, the default for the `nginx:alpine` container

Leave the rest as it is: pre- and post-deployment commands, image registry and custom Docker options are not needed for a static site.

**4. Deploy.** Press _Deploy_. Coolify installs the dependencies, runs `npm run build` and starts the container. When it is green, the site is live with HTTPS.

**5. Deploy on every push (optional).** Turn on automatic deployment and add the webhook from Coolify to the repository (_Settings → Webhooks_), or use Coolify's GitHub App. Every push to `main` then redeploys the site.

**Make sure the branch is `main`.** If Coolify is set to a fixed commit instead of a branch, it keeps building that commit.

**Checks.** Coolify only builds; it does not run the tests. The workflow in `.github/workflows/ci.yml` runs `npm run check` (types, lint, formatting, docs and tests) on every push and pull request, and shows a green or red mark on the commit on GitHub. A red mark does not stop Coolify, so look at it before you push to `main`.

**When something goes wrong:**

| Symptom                                      | Likely cause                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------ |
| Deploy does not start after a push           | The webhook is missing or the branch is wrong. Press _Redeploy_ and check the branch |
| Blank page, `404` on `/assets/...`           | The publish directory is not `/dist`                                                 |
| Certificate error                            | The `A` record has not propagated yet, or points to the wrong IP                     |
| `Permission denied (publickey)` when cloning | The deploy key is not added on GitHub, or belongs to another repository              |
| Old version in the browser                   | Reload with Ctrl+Shift+R                                                             |
| Something is broken after a deploy           | Coolify keeps earlier deployments: redeploy the previous one to roll back            |

## Manual nginx on a VPS

This route does by hand what Coolify does for you. The app is the easy part. Most of the work is making the server secure, and that is also the part worth learning properly.

The guide assumes Ubuntu LTS (24.04 or 26.04), which most VPS providers offer as a default. You need the server's IP address, access to the domain's DNS, and a Linux computer with `ssh` and `rsync`.

The guide uses `codeonscreen.yourdomain.com` throughout. Replace it with your own subdomain.

### 1. An SSH key on your computer

If you already have `~/.ssh/id_ed25519` you can skip this step.

```bash
ssh-keygen -t ed25519 -C "you@laptop"
```

The key replaces passwords completely. We turn password login off in step 3.

### 2. First login and a dedicated user

Your provider has given you a root password or installed your key. Log in, update everything and create a regular user, called `deploy` here.

```bash
ssh root@SERVER-IP
apt update && apt upgrade -y
adduser deploy
usermod -aG sudo deploy
```

Copy your key to the new user. Do this from your own computer, in a new terminal:

```bash
ssh-copy-id deploy@SERVER-IP
ssh deploy@SERVER-IP        # should log in without a password
```

### 3. Lock down SSH

Create a separate configuration file instead of editing the main one. That way the change survives system updates.

```bash
sudo tee /etc/ssh/sshd_config.d/99-hardening.conf >/dev/null <<'EOF'
PasswordAuthentication no
PermitRootLogin no
EOF
sudo sshd -t && sudo systemctl reload ssh
```

**Do not close the terminal you are logged in with.** Open a new terminal and test `ssh deploy@SERVER-IP`. If it works you can close the old one. If it does not, you still have an open session in which to fix the problem. This is the most common way of locking yourself out.

### 4. Firewall and automatic security updates

```bash
sudo apt install -y nginx unattended-upgrades
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'      # ports 80 and 443
sudo ufw enable
sudo dpkg-reconfigure -plow unattended-upgrades   # answer Yes
```

Now only SSH and the web are open, and security updates install themselves.

### 5. Point the subdomain at the server

At your DNS provider:

| Type | Name           | Value     |
| ---- | -------------- | --------- |
| A    | `codeonscreen` | SERVER-IP |

If the server also has an IPv6 address, add an `AAAA` record. From your computer, check that the record has propagated:

```bash
dig +short codeonscreen.yourdomain.com
```

If it answers with the server's IP address you are done. It can take a while.

### 6. nginx

Create the folder the app will live in and give `deploy` ownership, so you can upload without `sudo`:

```bash
sudo mkdir -p /var/www/code-on-screen
sudo chown deploy:deploy /var/www/code-on-screen
```

Copy the two configuration files from the repository. Do this from your computer:

```bash
scp deploy/nginx/code-on-screen.conf deploy/nginx/security-headers.conf deploy@codeonscreen.yourdomain.com:~
```

Put them in place on the server, replace the domain name and enable the site:

```bash
sudo mv ~/code-on-screen.conf /etc/nginx/sites-available/
sudo mv ~/security-headers.conf /etc/nginx/snippets/code-on-screen-security.conf
sudo sed -i 's/codeonscreen.example.com/codeonscreen.yourdomain.com/' /etc/nginx/sites-available/code-on-screen.conf
sudo ln -s /etc/nginx/sites-available/code-on-screen.conf /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

`nginx -t` tests the configuration before it is loaded. Always run that command before `reload`.

The comments in `code-on-screen.conf` and `security-headers.conf` explain every line. One detail is worth knowing: nginx only inherits `add_header` from the `server` block if the `location` block has none of its own. Our `location` blocks set `Cache-Control`, so the security headers are included in every block from a shared file.

### 7. First upload

From your computer, in the project folder:

```bash
DEPLOY_HOST=deploy@codeonscreen.yourdomain.com npm run deploy:vps
```

The script runs `npm run check`, builds, and uploads `dist/` with `rsync`. Open `http://codeonscreen.yourdomain.com`. The app should appear, still without HTTPS.

### 8. HTTPS with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d codeonscreen.yourdomain.com
sudo certbot renew --dry-run     # confirms that renewal works
```

Certbot adds HTTPS to your nginx configuration, redirects HTTP to HTTPS and renews the certificate automatically about every 60 days. You do not have to do anything more.

### 9. Verify

```bash
curl -I https://codeonscreen.yourdomain.com/
```

The response should contain `Cache-Control: no-cache` and `Content-Security-Policy`. Then open the app in a browser, open the developer tools (F12) and look under _Console_. There should be no red lines about "Content Security Policy". If there are, the message says which resource was blocked, and the directive for that resource in `security-headers.conf` is what needs adjusting.

### 10. Updating later

Use the same command as in step 7. Every upload replaces all files. Old files are removed (`--delete`), and thanks to the cache rules visitors get the new version on their next page load.

### When something goes wrong

| Symptom                            | Likely cause                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `403 Forbidden`                    | The folder is empty or has the wrong owner. Run `ls -la /var/www/code-on-screen`                        |
| Blank page, `404` on `/assets/...` | The trailing slash after `dist/` is missing in the rsync command, so the files ended up in a sub-folder |
| Certbot fails                      | The DNS record has not propagated yet, or port 80 is closed in the firewall                             |
| Old version after an upload        | Reload with Ctrl+Shift+R. If that does not help, check that `index.html` has `Cache-Control: no-cache`  |
| `Permission denied (publickey)`    | The key is not on the `deploy` user. Run `ssh-copy-id` again from your computer                         |
