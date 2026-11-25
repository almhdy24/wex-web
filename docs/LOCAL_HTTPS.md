# Local HTTPS & Push Testing Guide (Termux + nginx + Local CA)

Web Push (`PushManager` and Service Workers) requires a **secure context** (`https://` with a trusted certificate, or `http://localhost`). This guide explains how to test push notifications locally on this phone, another Android phone, iPhone, or desktop.

---

## Option A: Fastest Path — Same-Phone Testing on `http://localhost`

`http://localhost` is already treated as a secure context by Chrome on Android:
1. Start the API and Vite dev server with Service Worker enabled:
   ```bash
   bash scripts/local-https/start.sh dev
   ```
2. Open `http://localhost:5371` (or `https://localhost:8443`) in Chrome on the same phone.
3. Log in and enable notifications from **الحساب -> الإشعارات** or the **Admin Dashboard** banner.

---

## Option B: LAN Testing over Trusted HTTPS (nginx + Local Root CA)

### 1. Generate Local Root CA & Server Certificate (One-Time)
```bash
bash scripts/local-https/setup.sh
```
This creates `~/.wex-local-https/ca.crt` and a server certificate signed by it with SANs for `localhost`, `127.0.0.1`, `wex.local`, and your phone's current LAN IP.

### 2. Start / Stop / Status
- **Static production mode** (downloads `wex-web-dist` from latest CI run if not cached; zero Vite build on phone):
  ```bash
  bash scripts/local-https/start.sh static
  ```
- **Dev HMR mode** (Vite dev server with `VITE_DEV_SW=1`):
  ```bash
  bash scripts/local-https/start.sh dev
  ```
- **Check status / Stop**:
  ```bash
  bash scripts/local-https/status.sh
  bash scripts/local-https/stop.sh
  ```

---

## Installing the Local CA on Devices

### Android Chrome (Recommended)
1. Copy `~/.wex-local-https/ca.crt` to your Android Downloads folder (e.g. `cp ~/.wex-local-https/ca.crt ~/storage/downloads/wex-local-ca.crt`).
2. Open Android **Settings -> Security -> Encryption & credentials -> Install a certificate -> CA certificate**.
3. Tap **Install anyway** and select `wex-local-ca.crt`.
4. Open `https://<LAN-IP>:8443` in Chrome.

### Android Chrome Quick Alternative (No CA, Dev Only)
1. Open `chrome://flags/#unsafely-treat-insecure-origin-as-secure` in Android Chrome.
2. Add `http://<LAN-IP>:5371` (dev mode) and set to **Enabled**, then relaunch Chrome.
   > Note: This only works for Chrome on Android, not iOS or other browsers.

### iPhone / iPad (iOS 16.4+ Safari PWA)
1. Temporarily serve `ca.crt` over HTTP on LAN:
   ```bash
   python3 -m http.server 9090 --directory ~/.wex-local-https
   ```
2. On iPhone Safari, open `http://<LAN-IP>:9090/ca.crt` and tap **Allow** to download the profile. (Stop the Python HTTP server immediately after.)
3. Go to **Settings -> General -> VPN & Device Management -> Wex Local Dev Root CA -> Install**.
4. Go to **Settings -> General -> About -> Certificate Trust Settings** and enable full trust for **Wex Local Dev Root CA**.
5. Open `https://<LAN-IP>:8443` in **Safari**, tap **Share -> Add to Home Screen**, open the installed **Wex** icon, log in, and tap **تفعيل الإشعارات**.

### Desktop Chrome / Edge / Firefox
- **Windows/macOS**: Double-click `ca.crt` -> install into **Trusted Root Certification Authorities** (Windows) or Keychain -> **Always Trust** (macOS).
- **Linux Chrome/Edge**: `chrome://settings/certificates` -> **Authorities** -> **Import** `ca.crt` -> trust for websites.
- **Firefox**: `about:preferences#privacy` -> **View Certificates** -> **Authorities** -> **Import** `ca.crt`.

---

## Sending a Test Push
1. **Web Push (Browser/PWA)**:
   - Log in as Admin -> `/admin/settings` -> click **إشعار تجريبي**, OR
   - Log in as Customer -> `/account?tab=settings` -> click **إرسال إشعار تجريبي**.
2. **FCM (Future Flutter Android)**:
   ```bash
   cd ~/projects/wex-api && php spark push:fcm-test <FCM_TOKEN>
   ```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Certificate not trusted / SW refused | CA not installed or LAN IP changed | Re-run `setup.sh` if IP changed; re-install `ca.crt` and enable full trust on iOS |
| Service Worker not registering | Plain HTTP on non-localhost or `VITE_DEV_SW` not set | Use `https://<LAN-IP>:8443` or `start.sh dev` (sets `VITE_DEV_SW=1`) |
| Push permission blocked | Previously denied in browser | Clear site permissions in browser settings and reload |
| FCM/WebPush unreachable | Offline or blocked network | Check internet on phone; `php spark push:work` retries up to 5 times |
| Port 8443 or 8081 in use | Previous process still running | Run `bash scripts/local-https/stop.sh` |
| Termux kills background server | Android battery optimization | Disable battery optimization for Termux or acquire Termux wake-lock (`termux-wake-lock`) |
