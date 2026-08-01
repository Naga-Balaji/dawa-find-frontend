# Dawa-Find · Frontend

React web app for **Dawa-Find**, the fastest way to locate medicines and pharmacies in Vijayawada. Interactive Leaflet map, per-medicine SKU search, radius selector, shop detail pages with live inventory, and JWT auth.

> Backend repo: [dawa-find-backend](https://github.com/<your-username>/dawa-find-backend)

---

## ✨ Features

- 🗺️ **Interactive map** — Leaflet + OpenStreetMap, colour-coded user pin + search-radius ring
- 📍 **Auto-fit zoom** — map re-fits bounds whenever the search radius changes
- 🔎 **Medicine search** — SKU/brand/name lookup joins straight to nearby shops
- 🎚️ **Radius selector** — 1 · 2 · 5 · 10 · 20 · 50 km
- 🏥 **Shop cards** — searchable, defaults to all shops, updates on query
- 📋 **Pharmacy detail page** — inventory table with search, price, stock badges, Rx flag, mini-map
- 🔐 **Auth** — register / login / logout backed by JWT
- 🚨 **Emergency footer strip** — one-tap dial for 108/1066/104
- 📱 **Responsive** — dedicated mobile layout for hero, cards, and detail views

---

## 🧱 Tech stack

| Layer | Tool |
|-------|------|
| Framework | React 18 |
| Bundler | Vite 5 |
| Router | React Router 6 |
| Map | Leaflet 1.9 + react-leaflet 4 |
| HTTP | Axios (with JWT interceptor) |
| Styling | Hand-written CSS (no framework, teal + coral system) |

---

## 📁 Project structure

```
frontend/
├── public/
│   └── logo.svg               # Favicon (pin + pill mark)
├── src/
│   ├── api/client.js          # Axios instance + JWT interceptor
│   ├── components/
│   │   ├── Logo.jsx           # Inline SVG brand mark
│   │   └── Footer.jsx         # Emergency strip + multi-column footer
│   ├── pages/
│   │   ├── Home.jsx           # Landing: hero + map + cards + features
│   │   ├── PharmacyDetail.jsx # /pharmacy/:id — inventory + mini-map
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── App.jsx                # Routes + Navbar
│   ├── main.jsx               # React entry
│   └── styles.css             # Global styles
├── index.html
├── vite.config.js             # Dev proxy `/api` → :5000
└── package.json
```

---

## ⚙️ Setup

### 1. Clone & install

```bash
git clone https://github.com/<your-username>/dawa-find-frontend.git
cd dawa-find-frontend
npm install
```

### 2. Run

```bash
npm run dev                 # http://localhost:5173
```

Vite's dev server proxies `/api/*` to `http://localhost:5000` — make sure the [backend](https://github.com/<your-username>/dawa-find-backend) is running.

### 3. Build for production

```bash
npm run build
npm run preview             # local production preview
```

---

## 🔌 API integration

All requests go through `src/api/client.js`, which:
- Uses base URL `/api/v1`
- Auto-attaches `Authorization: Bearer <token>` from `localStorage`

Consumed endpoints:

| UI | Endpoint |
|----|----------|
| Landing map & cards | `GET /pharmacies` |
| "Use my location" + Nearby | `GET /pharmacies/nearby` |
| Medicine search | `GET /pharmacies/medicines/nearby` |
| Detail page header | `GET /pharmacies/:id` |
| Detail page inventory | `GET /pharmacies/:id/inventory` |
| Auth | `POST /auth/register` · `POST /auth/login` · `POST /auth/logout` |

---

## 🧪 Try it out

1. Open the landing page → click **📍 Use my location** (uses a hard-coded Vijayawada test coordinate)
2. Change the **Radius** selector — the map re-fits automatically
3. Type `paracetamol` in the search bar → shops carrying it filter down
4. Click **Explore →** on any card → see the full inventory table on the detail page
5. Register/login from the top-right → JWT stored in localStorage

---

## 🧭 Routes

| Path | Page |
|------|------|
| `/` | Landing — hero + map + shop cards + features |
| `/pharmacy/:id` | Shop detail with inventory |
| `/login` | Login |
| `/register` | Sign up |

---

## 🎨 Design system

- **Palette** — teal `#0f766e` (brand) · coral `#f97361` (accent) · slate greys · emergency red `#b91c1c`
- **Type** — Inter/system stack, tight tracking for headlines
- **Motifs** — pill-fused-with-pin logo · pulse dot on emergency strip · rounded 16 px cards
- **Voice** — utility-first, no fluff (users are usually in a hurry or worried)

---

## 🛣️ Roadmap

- [ ] Real geolocation (currently hard-coded for testing)
- [ ] Skeleton loaders
- [ ] Favourite pharmacies (per user)
- [ ] Stock-alert subscriptions
- [ ] Dark mode
- [ ] i18n (English / Telugu / Hindi)

---

## 📄 License

MIT
