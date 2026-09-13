<div align="center">

# 🌊 Life RPG
### *Turn Your Habits Into a Daily Quest*

**A gamified habit tracker where every routine becomes a mission, every streak builds momentum, and every gold coin is earned — never given.**

</div>

---

## ✨ What is Life RPG?

Traditional habit trackers feel like chores — check a box, feel nothing, forget by Thursday.

**Life RPG** borrows what actually makes games addictive — visible progress, non-linear leveling, and an economy you have to earn into — and points it at your real life. Track a habit, earn a Star Shell. Stack enough Star Shells, level up your Clearance. Save enough Gold, spend it in the Black Market on badges, themes, and titles.

No fake progress bars. No participation trophies. Your stats are calculated and validated server-side — you can't edit your own success.

---

## 🎮 Core Features

| Feature | Description |
|---|---|
| 🔐 **Real Authentication** | Full signup/login via Supabase Auth — no fake demo accounts required, though a Demo Mode exists for instant, no-signup exploration |
| ⭐ **Star Shells & Pearl Oysters** | Complete a habit → earn a Star Shell. Complete *every* habit in a day → earn a Pearl Oyster |
| 📈 **Non-Linear XP & Leveling** | `Level = √(XP ÷ 50) + 1` — each level demands more than the last. No flat grind |
| 🧠 **Attribute System** | Every habit is tagged to an Attribute — Intellect, Strength, Discipline, or Creativity — so your growth isn't just a number, it's *shaped* |
| 🔥 **Streaks** | Consecutive-day tracking that rewards showing up, not perfection |
| 💰 **Real Gold Economy** | Gold isn't handed out — it's *converted* from your Star Shells (10 Star Shells = 1 Gold), so spending power reflects real consistency |
| 🛒 **The Black Market** | Spend Gold on badges, cosmetic themes, and titles for your profile — a real economy, not a progress-bar decoration |
| 🎉 **Level-Up Celebrations** | A satisfying, non-blocking particle burst and toast every time you cross a threshold |
| 🛡️ **Server-Side Validation** | XP, Gold, and Attributes can only change through Postgres RPC functions gated by Row Level Security — no editing your own stats from DevTools |
| 📱 **Fully Responsive** | Works cleanly from a phone screen to a widescreen monitor |

---

## 🏗️ Tech Stack

Built deliberately simple — no framework, no build step, no bundler:

- **Frontend:** Vanilla HTML, CSS, and JavaScript (ES6+) — a lightweight SPA-style app using section-based routing
- **Backend:** [Supabase](https://supabase.com) — Postgres database, Authentication, and Row Level Security
- **Hosting:** [Vercel](https://vercel.com) — zero-config static deployment
- **Icons:** Font Awesome

No React. No Next.js. No webpack. Just the platform, used well.

---

## 🗂️ Project Structure

```
life-rpg/
├── index.html              # Login / Signup page
├── landing.html            # Marketing landing page (served at root)
├── app.html                # Main authenticated dashboard shell
├── assets/                 # Logo, hero illustrations, images
├── css/
│   ├── app.css              # Dashboard, cards, XP bar, shop styling
│   ├── auth.css             # Login/signup/landing ocean theme
│   └── components.css        # Shared component styles
├── js/
│   ├── config.js            # Supabase URL + anon key (see setup below)
│   ├── db.js                 # Data access layer — mirrors real + Demo Mode
│   ├── auth.js               # Login/signup logic, password visibility toggle
│   ├── home.js                # Dashboard rendering, XP bar, habit toggling
│   ├── habits.js              # Habit CRUD
│   ├── calendar.js            # Monthly habit calendar view
│   ├── insights.js            # Analytics & completion charts
│   ├── rewards.js             # Badge gallery
│   ├── shop.js                # Black Market UI + purchase flow
│   └── settings.js            # Account & profile settings
├── vercel.json              # Redirect config (root → landing page)
└── supabase_schema.sql      # Full database schema (see below)
```

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/bindusmita49/life-rpg-final.git
cd life-rpg-final
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Once created, go to **Settings → API** and copy your **Project URL** and **anon/publishable key**

### 3. Run the database schema

Open the Supabase **SQL Editor** and run the full contents of `supabase_schema.sql` in this repo. This creates:

- `profiles` — user data, XP, Gold, and Attribute scores
- `habits` — user-created habits, each tagged to an Attribute
- `habit_logs` — completion history (the source of truth for streaks & stats)
- `shop_items` / `owned_items` — the Black Market catalog and purchase records
- RPC functions `award_xp()` and `sync_gold()` — the *only* way stats can change, protected by Row Level Security

### 4. Configure your environment

Open `js/config.js` and fill in your credentials:

```javascript
const SUPABASE_URL  = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON = 'YOUR_ANON_KEY_HERE';
const DEMO_MODE = false;   // true = explore instantly with localStorage, no Supabase needed
```

> See `.env.example` for the same values in a portable reference format.

### 5. Run it locally

No build step required — it's static files.

```bash
npx serve .
```

Then open `http://localhost:3000/landing.html` in your browser.

---

## 🔒 Security Model

Every point of progression is protected:

- Row Level Security ensures a user can only ever read or write **their own** row in `profiles`, `habits`, `habit_logs`, and `owned_items`
- XP and Attribute changes only happen through the `award_xp()` Postgres function — direct client-side `UPDATE` statements on those columns are blocked by policy
- Gold is never awarded directly — it's *derived* from total Star Shells via `sync_gold()`, so it can't drift out of sync with real progress
- Purchases in the Black Market are validated server-side (`purchase_item()`) — insufficient Gold or duplicate ownership is rejected before any row is written

---

## 🎨 Design Philosophy

Life RPG leans into a **deep-sea ocean aesthetic** — dark navy-to-teal gradients, glowing cyan accents, and soft ambient bubble/ray animations — because habit-building should feel calm and immersive, not like a corporate dashboard. Every card, button, and progress bar uses consistent rounded geometry and glassmorphism, tying the whole experience together.

---


## 📄 License

MIT — see `LICENSE` for details.

---

<div align="center">

**Life RPG** — *One habit at a time, you're building a better you.* 🌊

</div>
