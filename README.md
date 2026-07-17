# MusicLocke 🎧

**MusicLocke** is a first-functional-prototype of a next-generation music streaming platform. It reimagines listening as something spatial and social — audio that lives across the rooms of your home, and tracks that carry conversation, credits, and context alongside the sound.

This repo is a self-contained Vite + React + Tailwind CSS app. It runs completely out of the box, with no API keys required — a local catalog powers search and playback until you add your own YouTube Data API key.

---

## ✨ Features

### SoundMap — multi-room audio, visualized
A drag-and-drop 2D layout of your home (Bedroom, Living Room, Kitchen, Patio). Each device is a glowing, pulsing bubble you can reposition, mute, or adjust individually — plus a master volume slider that scales every zone proportionally.

### MusicMedia — the social layer
A waveform seek bar where you can double-click any point to drop a timestamped emoji or comment, which floats up on screen exactly when playback reaches it. Alongside it, the **Liner Notes 2.0** panel slides out with full lyrics, an artist diary entry, and interactive instrument/production credits.

### MultiListen — shared rooms
Browse friends' live listening rooms and drop in instantly. The **Vibe Queue** demonstrates an algorithmic merge of two listeners' tastes, interleaving tracks by an affinity score.

### YouTube-powered search, with a real fallback
Search hits the YouTube Data API v3 (`search?part=snippet&type=video&videoCategoryId=10`) when a key is configured. Without one — or if the request fails — the app transparently falls back to a curated local catalog, so the experience is never broken or empty.

---

## 🧱 Tech Stack

- **React** (Vite)
- **Tailwind CSS** — dark-mode design system (`#0B0F19` void background, neon-green/electric-purple accents, glow shadows)
- **Framer Motion** — drag-and-drop SoundMap, panel transitions, floating reactions
- **lucide-react** — icon set

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the dev server

```bash
npm run dev
```

The app will open at `http://localhost:5173`. It works immediately — no configuration required.

### 3. (Optional) Add your YouTube Data API key — enables real playback

By default, search and playback use the bundled local catalog in `src/data/mockTracks.js`. With a key, search hits real YouTube **and tracks play real audio** via a hidden YouTube IFrame player.

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/) and enable the **YouTube Data API v3**.
2. Generate an API key under **APIs & Services → Credentials**.
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Paste your key into `.env`:
   ```
   VITE_YOUTUBE_API_KEY=your_key_here
   ```
5. Restart the dev server.

If the key is missing, invalid, or a request fails for any reason, MusicLocke automatically falls back to the local catalog — the UI never breaks.

### 4. (Optional) Add Firebase — enables sign-in and cross-device device sync

Without this, the app works fully but sign-in is hidden and any devices you add in SoundMap only live in that browser tab.

1. Create a free project at the [Firebase console](https://console.firebase.google.com).
2. In your project, click **Add app → Web**, and copy the config values shown.
3. **Build → Authentication → Get started → Sign-in method → Google → Enable.**
4. **Build → Firestore Database → Create database** (test mode is fine while you're trying it out — see the security rules note below before going further).
5. Paste your config into `.env`:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
6. Restart the dev server. A **Sign in** button now appears in the header.

Once signed in, any device added via **SoundMap → Add device** (Bluetooth pairing or a manual name) is stored in Firestore under that account and appears in real time on every other browser/session signed into the same account.

**Bluetooth note:** pairing uses the real [Web Bluetooth API](https://developer.chrome.com/docs/capabilities/bluetooth) (Chrome/Edge on desktop or Android only — not Safari or Firefox) and confirms a real nearby device by name. Browsers have no way to route audio output to an arbitrary paired device, though — that's controlled by your OS's system audio settings, not JavaScript. Paired devices show up in the SoundMap for volume/zone management the same way the built-in demo zones do.

**Security rules for production:** test mode leaves Firestore wide open. Before sharing this publicly, lock it down to each signed-in user's own data, e.g.:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/devices/{deviceId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. Build for production

```bash
npm run build
npm run preview
```

### 6. Deploy to GitHub Pages

This repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and deploys automatically — no manual build/push step needed.

`vite.config.js` uses a **relative base path** (`base: "./"`), so it works regardless of your repo name or its exact letter case — no config edits needed if you rename the repo.

1. Push this repo's contents (including the hidden `.github` folder) to your GitHub repo's `main` branch.
2. In your repo: **Settings → Pages → Source → GitHub Actions.**
3. Check the **Actions** tab — a run should start automatically and finish with a green check within about a minute.
4. Visit `https://<username>.github.io/<repo-name>/`.

If you ever see a blank/white page after this, it almost always means Source is still set to "Deploy from a branch" instead of "GitHub Actions" — that setting doesn't carry over automatically and has to be set once per repo.

---

## 📁 Project Structure

```
musiclocke/
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
├── .env.example
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── context/
    │   ├── AuthContext.jsx        # Firebase Google sign-in state
    │   └── PlaybackContext.jsx    # playback, real YouTube audio, synced devices
    ├── components/
    │   ├── Sidebar.jsx
    │   ├── SearchBar.jsx
    │   ├── AccountPanel.jsx       # sign-in / sign-out UI
    │   ├── AddDeviceMenu.jsx      # Bluetooth pairing + manual device add
    │   ├── SoundMap.jsx           # drag-and-drop multi-room device canvas
    │   ├── MusicMedia.jsx         # waveform, reactions, Liner Notes 2.0
    │   ├── MultiListen.jsx        # shared rooms + Vibe Queue
    │   └── PlayerBar.jsx          # persistent bottom transport bar
    ├── data/
    │   └── mockTracks.js          # local fallback catalog, reactions, rooms
    └── services/
        ├── youtube.js             # YouTube Data API v3 search client + fallback
        ├── youtubePlayer.js       # YouTube IFrame Player API loader (real audio)
        └── firebase.js            # Firebase app/auth/Firestore init
```

---

## 🗺️ Roadmap Ideas

- Real multi-device audio routing (Web Audio API / Cast integration) behind the SoundMap UI
- Persisted rooms and reactions via a backend (currently in-memory/mock)
- `videos.list(part=contentDetails)` follow-up call for accurate YouTube track durations
- Authenticated friend graph for MultiListen

---

## License

MIT — build on it freely.
