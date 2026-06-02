# 🎮 Gamification — Badge System

A lightweight achievement system to reward exploration of GSoC organizations. All progress is stored locally — no account required, fully private.

---

## 🏅 Badge Types

**2 badge types, 4 levels each = 8 total badges**

| Badge | Tracks | Bronze | Silver | Gold | Platinum |
|-------|--------|--------|--------|------|----------|
| 🔍 Explorer | Org views (modal opens) | 10 | 25 | 50 | 100 |
| ⚖️ Comparator | Comparisons initiated | 5 | 15 | 30 | 50 |

---

## ⚙️ How It Works

- Progress is stored in **browser `localStorage`** — no account required, fully private
- Progress is **per-device/browser** and resets if browser data is cleared
- A **toast notification** appears when a new badge level is unlocked
- View progress anytime via the **Analytics panel** (📊 icon in the navbar)
- Reset progress via the **"Reset Progress"** button in the Analytics panel

---

## 🗄️ `localStorage` Schema

The badge system uses the following `localStorage` keys:

| Key | Type | Description |
|-----|------|-------------|
| `gsoc_badge_explorer` | `number` | Total org views (modal opens) |
| `gsoc_badge_comparator` | `number` | Total comparisons initiated |
| `gsoc_badge_explorer_level` | `string` | Current Explorer badge level: `bronze`, `silver`, `gold`, `platinum`, or `null` |
| `gsoc_badge_comparator_level` | `string` | Current Comparator badge level |
| `gsoc_analytics` | `object` (JSON) | Full analytics payload — visits, searches, org views, filters, session time |

---

## 📂 Implementation Files

| File | Role |
|------|------|
| `src/js/badges-mvp.js` | Core badge logic: progress tracking, level unlock detection, toast notifications |
| `index.html` | Analytics panel UI + badge display markup + badge CSS styles |

---

## 🔧 How Badge Unlocks Work (`badges-mvp.js`)

1. **Track action** — When a user views an org or initiates a comparison, `badges-mvp.js` increments the relevant counter in `localStorage`.
2. **Check thresholds** — After incrementing, the script compares the counter against badge thresholds (Bronze: 10 views, Silver: 25, etc.).
3. **Detect new level** — If the new count crosses a threshold the user hasn't achieved yet, the new level is recorded.
4. **Fire toast** — A non-blocking toast notification appears in the bottom-right corner with the badge name and level.
5. **Update Analytics panel** — The Analytics panel reflects updated badge progress on next open.

---

## ➕ How to Add a New Badge (Developer Guide)

To add a new badge type (e.g., a "Search Master" badge):

### Step 1 — Define thresholds in `badges-mvp.js`

```js
const BADGES = {
  explorer:   { thresholds: [10, 25, 50, 100], key: 'gsoc_badge_explorer' },
  comparator: { thresholds: [5, 15, 30, 50],   key: 'gsoc_badge_comparator' },
  // Add new badge:
  searcher:   { thresholds: [5, 20, 50, 100],  key: 'gsoc_badge_searcher' },
};
```

### Step 2 — Track the action

In `src/js/app.js`, wherever the search event fires, call:

```js
trackBadgeProgress('searcher');
```

### Step 3 — Add the UI in `index.html`

In the Analytics panel section, add a badge card element for the new badge following the existing `explorer` and `comparator` card pattern.

### Step 4 — Update this doc

Add the new badge to the Badge Types table above.

---

## 🔮 Future Ideas

| Idea | Badge Name | Tracks |
|------|-----------|--------|
| Track search activity | 🔎 Search Master | Number of searches performed |
| Track filter usage | 🏷️ Filter Pro | Number of filter combinations used |
| Track keyboard nav | ⌨️ Power User | Number of keyboard navigation actions |
| Cross-device sync | Any | Requires backend — not currently planned |

---

## 🔗 Related Docs

- [docs/ARCHITECTURE.md](ARCHITECTURE.md) — Module responsibilities including `badges-mvp.js`
- [docs/index.md](index.md) — Documentation navigation hub
- [README.md](../README.md) — Project overview
