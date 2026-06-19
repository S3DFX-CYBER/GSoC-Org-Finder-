/**
 * GSoC Guide Chat – src/js/gsoc-guide.js
 *
 * Bugs fixed vs. the original spec:
 *  B1 – Request serialisation lock  (concurrent-call guard via `isFetching`)
 *  B2 – AbortController fetch timeout  (8 s hard limit)
 *  B3 – Safe localStorage  (every read/write wrapped in try-catch)
 *  B4 – Focused escape-key handling  (listener on dialog, not window)
 *  B5 – Native <dialog> open/close  (showModal / close, not class toggle)
 *  B6 – Proper ARIA live-region  (aria-live="polite" on message list)
 *  B7 – Input sanitisation  (strip control chars, cap at 300 chars client-side)
 *
 * CI fixes (cubic-dev-ai):
 *  C1 – localStorage schema validation: coerce non-array parsed values to []
 *       to prevent TypeErrors on .push()/.slice()/.forEach() for returning users.
 *  C2 – Sanitisation regex now preserves \n (LF) and \r (CR) so Shift+Enter
 *       newlines are not silently stripped, matching the UI hint.
 *  C3 – Abort differentiation: user-initiated dialog close no longer persists
 *       a false "timed out" error message in chat history.
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────
   * 1. CONSTANTS
   * ───────────────────────────────────────────── */
  const API_ENDPOINT      = '/api/gsoc-guide';
  const MAX_INPUT_LENGTH  = 300;
  const FETCH_TIMEOUT_MS  = 8_000;
  const MAX_HISTORY_MSGS  = 20;          // keep localStorage lean
  const STORAGE_KEY       = 'gsocGuideHistory';

  /* ─────────────────────────────────────────────
   * 2. DOM REFERENCES
   *    All elements are queried once after DOMContentLoaded.
   * ───────────────────────────────────────────── */
  let dialog, toggleBtn, messageList, form, input, submitBtn, clearBtn;

  /* ─────────────────────────────────────────────
   * 3. STATE
   * ───────────────────────────────────────────── */
  let isFetching    = false;   // B1 – serialisation lock
  let abortCtrl     = null;    // B2 – current AbortController
  // C3 – tracks whether the current abort was user-initiated (dialog close)
  // vs. a genuine network timeout, so we don't persist false error messages.
  let isUserAbort   = false;

  /* ─────────────────────────────────────────────
   * 4. SAFE LOCALSTORAGE HELPERS  (B3)
   * ───────────────────────────────────────────── */
  function storageGet(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      // C1 – Schema validation: JSON.parse can return null, {}, numbers, etc.
      // Any non-array value would cause TypeErrors downstream on .push()/.slice().
      // Coerce all non-array results to a safe empty array.
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      // Quota exceeded or private-mode block – silently continue.
    }
  }

  function storageClear(key) {
    try {
      localStorage.removeItem(key);
    } catch (_) { /* noop */ }
  }

  /* ─────────────────────────────────────────────
   * 5. MESSAGE HISTORY (persisted)
   * ───────────────────────────────────────────── */
  function loadHistory() {
    return storageGet(STORAGE_KEY);
  }

  function saveHistory(messages) {
    // Keep only the most recent MAX_HISTORY_MSGS entries to stay under quota.
    const trimmed = messages.slice(-MAX_HISTORY_MSGS);
    storageSet(STORAGE_KEY, trimmed);
  }

  function clearHistory() {
    storageClear(STORAGE_KEY);
  }

  /* ─────────────────────────────────────────────
   * 6. DOM HELPERS
   * ───────────────────────────────────────────── */
  function createMessageEl(role, text) {
    const li = document.createElement('li');
    li.className = `guide-message guide-message--${role}`;
    li.setAttribute('data-role', role);

    const label = document.createElement('span');
    label.className = 'guide-message__label';
    label.textContent = role === 'user' ? 'You' : 'Guide';
    label.setAttribute('aria-hidden', 'true');

    const body = document.createElement('p');
    body.className = 'guide-message__body';
    // Use textContent to prevent XSS – never innerHTML with user data.
    body.textContent = text;

    li.append(label, body);
    return li;
  }

  function appendMessage(role, text) {
    const el = createMessageEl(role, text);
    messageList.appendChild(el);
    // Scroll to the new message.
    el.scrollIntoView({ behavior: 'smooth', block: 'end' });
    return el;
  }

  function showTypingIndicator() {
    const li = document.createElement('li');
    li.className = 'guide-message guide-message--assistant guide-message--typing';
    li.setAttribute('aria-label', 'Guide is typing');
    li.id = 'guideTypingIndicator';

    const dot = () => {
      const s = document.createElement('span');
      s.setAttribute('aria-hidden', 'true');
      return s;
    };
    li.append(dot(), dot(), dot());
    messageList.appendChild(li);
    li.scrollIntoView({ behavior: 'smooth', block: 'end' });
    return li;
  }

  function removeTypingIndicator() {
    const el = document.getElementById('guideTypingIndicator');
    if (el) el.remove();
  }

  function renderHistory(messages) {
    messageList.innerHTML = '';
    messages.forEach(({ role, content }) => appendMessage(role, content));
  }

  function setLoadingState(loading) {
    submitBtn.disabled = loading;
    input.disabled     = loading;
    submitBtn.textContent = loading ? 'Sending…' : 'Send';
    submitBtn.setAttribute('aria-busy', String(loading));
  }

  /* ─────────────────────────────────────────────
   * 7. SHORTLISTED ORGS CONTEXT
   *    Reads from whatever the main app exposes.
   *    Gracefully returns [] if the function is absent.
   * ───────────────────────────────────────────── */
  function getShortlistedOrgs() {
    try {
      if (typeof window.getShortlistedOrgs === 'function') {
        return window.getShortlistedOrgs();
      }
      // Fallback: read from a known localStorage key the main app may use.
      return storageGet('shortlistedOrgs') || [];
    } catch (_) {
      return [];
    }
  }

  /* ─────────────────────────────────────────────
   * 8. INPUT SANITISATION  (B7, client-side layer)
   * ───────────────────────────────────────────── */
  function sanitiseInput(raw) {
    return raw
      // C2 – Preserve \x0A (LF) and \x0D (CR) so Shift+Enter newlines are kept.
      // Original /[\x00-\x1F\x7F]/g stripped ALL control chars including newlines,
      // contradicting the "Shift+Enter for new line" UI hint.
      // Updated range excludes 0x0A and 0x0D explicitly:
      //   0x00–0x09  (controls before LF)
      //   0x0B–0x0C  (VT, FF – not newlines)
      //   0x0E–0x1F  (controls after CR)
      //   0x7F       (DEL)
      .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .trim()
      .slice(0, MAX_INPUT_LENGTH);
  }

  /* ─────────────────────────────────────────────
   * 9. API CALL WITH TIMEOUT  (B1 + B2)
   * ───────────────────────────────────────────── */
  async function sendMessage(userText, history) {
    // B1 – serialisation lock: reject concurrent calls.
    if (isFetching) return null;
    isFetching  = true;
    isUserAbort = false;   // C3 – reset abort-reason flag for each new request

    // B2 – AbortController with 8 s timeout.
    abortCtrl  = new AbortController();
    const timerId = setTimeout(() => abortCtrl.abort(), FETCH_TIMEOUT_MS);

    try {
      const recentMessages = history
        .slice(-10)                          // last 10 exchanges = 20 turns
        .map(({ role, content }) => ({ role, content }));

      const response = await fetch(API_ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        signal:  abortCtrl.signal,
        body:    JSON.stringify({
          question:        userText,
          shortlistedOrgs: getShortlistedOrgs(),
          recentMessages,
        }),
      });

      clearTimeout(timerId);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (typeof data.reply !== 'string') {
        throw new Error('Malformed response from server.');
      }
      return data.reply;

    } catch (err) {
      clearTimeout(timerId);
      if (err.name === 'AbortError') {
        // C3 – Differentiate user-initiated close from genuine network timeout.
        // If the user closed/dismissed the dialog, isUserAbort is true —
        // return null silently so no error is appended to chat history.
        // Only show the timeout message for real network timeouts.
        if (isUserAbort) {
          return null;
        }
        return '⚠️ Request timed out. Please try again.';
      }
      console.error('[GSoC Guide] Fetch error:', err);
      return `⚠️ Something went wrong: ${err.message}`;
    } finally {
      isFetching  = false;
      abortCtrl   = null;
      isUserAbort = false;
    }
  }

  /* ─────────────────────────────────────────────
   * 10. FORM SUBMIT HANDLER
   * ───────────────────────────────────────────── */
  async function handleSubmit(e) {
    e.preventDefault();

    // B1 – guard: do nothing if already in flight.
    if (isFetching) return;

    const raw  = input.value;
    const text = sanitiseInput(raw);

    if (!text) {
      input.focus();
      return;
    }

    // Load current history.
    const history = loadHistory();

    // Optimistically render user message.
    input.value = '';
    appendMessage('user', text);
    history.push({ role: 'user', content: text });
    saveHistory(history);

    // Show typing indicator & lock UI.
    setLoadingState(true);
    showTypingIndicator();

    // Call API.
    const reply = await sendMessage(text, history);

    // Remove typing indicator.
    removeTypingIndicator();
    setLoadingState(false);

    if (reply) {
      appendMessage('assistant', reply);
      history.push({ role: 'assistant', content: reply });
      saveHistory(history);
    }

    input.focus();
  }

  /* ─────────────────────────────────────────────
   * 11. DIALOG OPEN / CLOSE  (B5)
   *     Using native showModal() / close() so the browser
   *     automatically handles the top-layer, focus trap,
   *     and backdrop.
   * ───────────────────────────────────────────── */
  function openDialog() {
    if (dialog.open) return;
    // Render persisted messages before showing.
    renderHistory(loadHistory());
    dialog.showModal();          // B5 – native API
    // Move focus to input for immediate keyboard access.
    input.focus();
  }

  function closeDialog() {
    // C3 – Mark this abort as user-initiated before calling abort(),
    // so sendMessage's catch block can distinguish it from a network timeout
    // and suppress the false "timed out" error message.
    if (abortCtrl) {
      isUserAbort = true;
      abortCtrl.abort();
    }
    dialog.close();              // B5 – native API
    toggleBtn.focus();           // return focus to trigger (WCAG 2.1 SC 3.2.2)
  }

  /* ─────────────────────────────────────────────
   * 12. ESCAPE KEY  (B4)
   *     Attach listener to the dialog element, not window.
   *     Native <dialog> already handles Escape → close(),
   *     but we hook 'cancel' to restore toggle focus.
   * ───────────────────────────────────────────── */
  function onDialogCancel(e) {
    // 'cancel' fires when user presses Escape on a native dialog.
    e.preventDefault();          // prevent default close so we control the sequence
    closeDialog();
  }

  /* ─────────────────────────────────────────────
   * 13. CLEAR HISTORY
   * ───────────────────────────────────────────── */
  function handleClear() {
    clearHistory();
    messageList.innerHTML = '';
    input.focus();
  }

  /* ─────────────────────────────────────────────
   * 14. CHARACTER COUNTER (UX nicety)
   * ───────────────────────────────────────────── */
  function updateCharCounter() {
    const counter = document.getElementById('gsocGuideCharCount');
    if (!counter) return;
    const remaining = MAX_INPUT_LENGTH - input.value.length;
    counter.textContent = `${remaining} characters remaining`;
    counter.style.color = remaining < 20 ? 'var(--color-warn, #b45309)' : '';
  }

  /* ─────────────────────────────────────────────
   * 15. INIT
   * ───────────────────────────────────────────── */
  function init() {
    dialog     = document.getElementById('gsocGuidePanel');
    toggleBtn  = document.getElementById('gsocGuideToggle');
    messageList= document.getElementById('gsocGuideMessages');
    form       = document.getElementById('gsocGuideForm');
    input      = document.getElementById('gsocGuideInput');
    submitBtn  = form ? form.querySelector('button[type="submit"]') : null;
    clearBtn   = document.getElementById('gsocGuideClear');

    // Abort early if the guide panel is not in the DOM.
    if (!dialog || !toggleBtn || !messageList || !form || !input || !submitBtn) {
      console.warn('[GSoC Guide] One or more required DOM elements are missing.');
      return;
    }

    // B6 – Ensure the message list is a live region for screen readers.
    messageList.setAttribute('aria-live', 'polite');
    messageList.setAttribute('aria-atomic', 'false');
    messageList.setAttribute('aria-relevant', 'additions');

    // Wire up toggle button.
    toggleBtn.addEventListener('click', openDialog);

    // B4 / B5 – Escape key via native 'cancel' event on <dialog>.
    dialog.addEventListener('cancel', onDialogCancel);

    // Close on backdrop click (clicking the <dialog> element itself = outside content).
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) closeDialog();
    });

    // Close button inside the dialog header.
    const closeBtn = document.getElementById('gsocGuideClose');
    if (closeBtn) closeBtn.addEventListener('click', closeDialog);

    // Form submission.
    form.addEventListener('submit', handleSubmit);

    // Clear history button.
    if (clearBtn) clearBtn.addEventListener('click', handleClear);

    // Character counter.
    input.addEventListener('input', updateCharCounter);
    // Initialise counter display.
    updateCharCounter();

    // Enforce client-side max length (server validates too).
    input.setAttribute('maxlength', String(MAX_INPUT_LENGTH));
  }

  /* ─────────────────────────────────────────────
   * 16. BOOT
   * ───────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();   // DOM already parsed (e.g. script deferred)
  }

})();