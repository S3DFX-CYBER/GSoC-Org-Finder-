# Gamification — MVP Badge System

---

### 🌐 Navigation
[🏠 Home (README)](../README.md) • [🤝 Contributing Guide](../CONTRIBUTING.md) • [📜 Code of Conduct](../CODE_OF_CONDUCT.md) • [🛡️ Security Policy](../SECURITY.md)

---

A lightweight achievement system designed to reward and encourage thorough exploration of GSoC organizations.

---

## 🏆 Current Achievements

The MVP supports **2 badge types**, each spanning **4 levels** for a total of **8 unlockable achievements**:

| Badge | Tracked Metric | Bronze | Silver | Gold | Platinum |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **🔍 Explorer** | Organization details viewed | **10** Views | **25** Views | **50** Views | **100** Views |
| **⚖️ Comparator** | Side-by-side comparisons run | **5** Runs | **15** Runs | **30** Runs | **50** Runs |

---

## ⚙️ How It Works

*   **100% Privacy Focused** — All progress tracking is computed entirely in your browser using standard `localStorage` APIs. Zero data is ever sent to any external server.
*   **Persistent & Local** — Progress persists across sessions, but will reset if you clear your browser's history or local storage cookies.
*   **Toast Notifications** — Unlocking a new level triggers an animated, non-blocking visual toast notification.
*   **Analytics Panel** — Monitor your badge progress, see detailed stats, and review your unlock metrics at any time by clicking the 📊 Analytics icon in the navbar.
*   **Reset Metrics** — You can manually flush all tracked analytics and reset your badge progression via the "Reset Progress" button inside the Analytics panel.

---

## 📂 Source Code & Components

*   `src/js/badges-mvp.js` — Core game engine governing user action tracking, achievement unlock parameters, and toast triggers.
*   `index.html` — The HTML markup and styling rules rendering the badges progress panel and animated notification toast structures.

---

## 💡 Future Roadmap Ideas

*   **Search Master** — Badge to reward users who run extensive tech search queries.
*   **Filter Pro** — Tracks utilization of multi-select language filters and quick chips.
*   **Secure Sync** — Support cross-device progress synchronization using light edge-runtime database bindings.
