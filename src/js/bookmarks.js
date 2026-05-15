// src/js/bookmarks.js
// ─── One-time migration from old localStorage key ───
(function migrateLegacyBookmarks() {
  try {
    const old = localStorage.getItem("bookmarks");
    if (old && !localStorage.getItem("gsoc_bookmarks_v2")) {
      localStorage.setItem("gsoc_bookmarks_v2", old);
      localStorage.removeItem("bookmarks");
    }
  } catch (e) {}
})();

// ─── BookmarkManager ───
const BookmarkManager = (() => {
  const STORAGE_KEY = "gsoc_bookmarks_v2";
  const ORDER_KEY = "gsoc_bookmarks_order_v2";

  function loadBookmarks() {
    try {
      return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
    } catch {
      return new Set();
    }
  }
  function loadOrder() {
    try {
      return JSON.parse(localStorage.getItem(ORDER_KEY) || "[]");
    } catch {
      return [];
    }
  }
  function saveBookmarks(set, order) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
      localStorage.setItem(ORDER_KEY, JSON.stringify(order));
    } catch (e) {
      console.warn("[BookmarkManager] localStorage write failed:", e);
    }
  }

  let bookmarkedSet = loadBookmarks();
  let bookmarkOrder = loadOrder().filter((n) => bookmarkedSet.has(n));

  return {
    has(name) {
      return bookmarkedSet.has(name);
    },
    add(name) {
      if (bookmarkedSet.has(name)) return false;
      bookmarkedSet.add(name);
      bookmarkOrder.unshift(name);
      saveBookmarks(bookmarkedSet, bookmarkOrder);
      return true;
    },
    remove(name) {
      if (!bookmarkedSet.has(name)) return false;
      bookmarkedSet.delete(name);
      bookmarkOrder = bookmarkOrder.filter((n) => n !== name);
      saveBookmarks(bookmarkedSet, bookmarkOrder);
      return true;
    },
    toggle(name) {
      return this.has(name)
        ? (this.remove(name), false)
        : (this.add(name), true);
    },
    getAll() {
      return [...bookmarkedSet];
    },
    getCount() {
      return bookmarkedSet.size;
    },
    clear() {
      bookmarkedSet.clear();
      bookmarkOrder = [];
      saveBookmarks(bookmarkedSet, bookmarkOrder);
    },
    getSortedOrgs(sortKey = "added") {
      const ordered = bookmarkOrder
        .map((name) => ORGS.find((o) => o.name === name))
        .filter(Boolean);
      if (sortKey === "alpha")
        return [...ordered].sort((a, b) => a.name.localeCompare(b.name));
      if (sortKey === "years-desc")
        return [...ordered].sort((a, b) => b.years - a.years);
      if (sortKey === "comp-low") {
        const rank = { chill: 0, moderate: 1, hot: 2 };
        return [...ordered].sort(
          (a, b) => (rank[a.competition] || 1) - (rank[b.competition] || 1),
        );
      }
      return ordered; // 'added' = insertion order
    },
  };
})();

// ─── Toast ───
let _toastTimer = null;
function showToast(msg, icon = "star", iconFill = true) {
  const toast = document.getElementById("fav-toast");
  const msgEl = document.getElementById("fav-toast-msg");
  const iconEl = toast?.querySelector(".material-symbols-outlined");
  if (!toast || !msgEl) return;
  msgEl.textContent = msg;
  iconEl.textContent = icon;
  iconEl.classList.toggle("icon-fill", iconFill);
  iconEl.style.color = iconFill ? "#f59e0b" : "#a1a1aa";
  toast.classList.add("show");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

// ─── Count badge ───
function updateFavCount() {
  const badge = document.getElementById("favCount");
  if (!badge) return;
  badge.textContent = BookmarkManager.getCount();
  badge.classList.remove("bump");
  void badge.offsetWidth;
  badge.classList.add("bump");
}

// ─── Helpers ───
function getOrgInitials(name) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const COMP_COLORS = {
  hot: { bg: "#fee2e2", text: "#991b1b", label: "🔥 Hot" },
  moderate: { bg: "#fef9c3", text: "#854d0e", label: "⚡ Moderate" },
  chill: { bg: "#dcfce7", text: "#166534", label: "🌿 Chill" },
};

// ─── Render favorites grid ───
function renderFavGrid() {
  const grid = document.getElementById("favGrid");
  const sortSel = document.getElementById("favSortSelect");
  const clearBtn = document.getElementById("clearFavsBtn");
  if (!grid) return;

  const sortKey = sortSel?.value || "added";
  const orgs = BookmarkManager.getSortedOrgs(sortKey);
  const hasAny = orgs.length > 0;

  sortSel?.classList.toggle("hidden", !hasAny);
  clearBtn?.classList.toggle("hidden", !hasAny);
  updateFavCount();

  if (!hasAny) {
    grid.innerHTML = `
      <div class="fav-empty col-span-full">
        <div class="fav-empty-icon">⭐</div>
        <h3 class="text-xl font-extrabold text-zinc-700 dark:text-zinc-200 font-headline">No favorites yet</h3>
        <p class="text-zinc-500 text-sm max-w-xs">
          Click the <strong class="text-amber-500">★</strong> star on any organization card to save it here.
        </p>
        <a href="#orgs" class="mt-2 inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full text-sm font-bold hover:bg-orange-600 transition-colors shadow-md">
          <span class="material-symbols-outlined text-sm">search</span> Browse Organizations
        </a>
      </div>`;
    return;
  }

  grid.innerHTML = orgs
    .map((org, i) => {
      const comp = COMP_COLORS[org.competition] || COMP_COLORS.moderate;
      const gh = org.github.split("/")[0];
      const logoSrc = `https://github.com/${escapeHtml(gh)}.png?size=80`;
      const tagsHtml = org.tags
        .slice(0, 3)
        .map(
          (t) =>
            `<span class="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded">${escapeHtml(t)}</span>`,
        )
        .join("");
      const safeIdeas = sanitizeHrefUrl(org.ideas);

      return `
      <article class="fav-card group" style="animation-delay:${i * 0.05}s"
               data-fav-name="${escapeHtml(org.name)}" tabindex="0"
               role="article" aria-label="${escapeHtml(org.name)} favorite card">
        <div class="shrink-0">
          <img src="${logoSrc}" alt="${escapeHtml(org.name)} logo" class="org-logo"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
          <div class="org-logo-placeholder" style="display:none">${getOrgInitials(org.name)}</div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2 mb-1">
            <div>
              <span class="text-[9px] font-label uppercase tracking-widest text-primary">${escapeHtml(org.cat)}</span>
              <h3 class="font-headline font-bold text-[0.95rem] leading-snug text-zinc-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">${escapeHtml(org.name)}</h3>
            </div>
            <button class="bookmark-btn active fav-remove-btn shrink-0 mt-0.5"
                    data-name="${escapeHtml(org.name)}"
                    title="Remove from favorites"
                    aria-label="Remove ${escapeHtml(org.name)} from favorites"
                    aria-pressed="true">
              <span class="material-symbols-outlined text-base icon-fill">star</span>
            </button>
          </div>
          <p class="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2 leading-relaxed">${escapeHtml(org.desc)}</p>
          <div class="flex flex-wrap items-center gap-1.5 mb-2">${tagsHtml}</div>
          <div class="flex items-center gap-3 pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style="background:${comp.bg};color:${comp.text}">${comp.label}</span>
            <span class="text-[10px] text-zinc-400 font-label">${escapeHtml(String(org.years))}y in GSoC</span>
            ${
              safeIdeas
                ? `<a href="${escapeHtml(safeIdeas)}" target="_blank" rel="noopener noreferrer"
               class="ml-auto text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
               onclick="event.stopPropagation()">
              Ideas <span class="material-symbols-outlined text-[11px]">open_in_new</span>
            </a>`
                : ""
            }
          </div>
        </div>
      </article>`;
    })
    .join("");

  // Remove button listeners
  grid.querySelectorAll(".fav-remove-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const name = btn.dataset.name;
      const card = btn.closest(".fav-card");
      if (card) {
        card.classList.add("removing");
        card.addEventListener(
          "animationend",
          () => {
            BookmarkManager.remove(name);
            renderFavGrid();
            syncBookmarkButtons();
            showToast(`Removed "${name}" from favorites`, "star", false);
          },
          { once: true },
        );
      }
    });
  });

  // Click card → open modal
  grid.querySelectorAll(".fav-card").forEach((card) => {
    card.addEventListener("click", () => openModal(card.dataset.favName));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        card.click();
      }
    });
  });
}

// ─── Sync all bookmark star buttons across the page ───
function syncBookmarkButtons() {
  document.querySelectorAll(".bookmark-btn[data-name]").forEach((btn) => {
    const isBookmarked = BookmarkManager.has(btn.dataset.name);
    const icon = btn.querySelector(".material-symbols-outlined");
    btn.classList.toggle("active", isBookmarked);
    if (icon) icon.classList.toggle("icon-fill", isBookmarked);
    btn.title = isBookmarked ? "Remove from favorites" : "Add to favorites";
    btn.setAttribute("aria-pressed", String(isBookmarked));
    btn.setAttribute(
      "aria-label",
      `${isBookmarked ? "Remove" : "Add"} ${btn.dataset.name} ${isBookmarked ? "from" : "to"} favorites`,
    );
  });
}

// ─── Main toggle entry point ───
function toggleFavorite(e, name) {
  if (e) e.stopPropagation();
  const added = BookmarkManager.toggle(name);
  syncBookmarkButtons();
  renderFavGrid();
  showToast(
    added ? `"${name}" added to favorites` : `"${name}" removed from favorites`,
    "star",
    added,
  );
  if (added && BookmarkManager.getCount() === 1) {
    setTimeout(
      () =>
        document
          .getElementById("favorites-section")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      500,
    );
  }
}

// ─── Event listeners ───
document.getElementById("clearFavsBtn")?.addEventListener("click", () => {
  if (
    !confirm(
      `Clear all ${BookmarkManager.getCount()} favorites? This cannot be undone.`,
    )
  )
    return;
  BookmarkManager.clear();
  renderFavGrid();
  syncBookmarkButtons();
  showToast("All favorites cleared", "delete_sweep", false);
});
document
  .getElementById("favSortSelect")
  ?.addEventListener("change", renderFavGrid);
