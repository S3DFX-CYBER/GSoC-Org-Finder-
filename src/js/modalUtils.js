const FOCUSABLE_ELEMENTS_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

class ModalManager {
  lastFocusedElement = null;

  setLastFocusedElement(element) {
    this.lastFocusedElement = element;
  }

  restoreFocus() {
    if (this.lastFocusedElement && document.contains(this.lastFocusedElement)) {
      this.lastFocusedElement.focus();
    }
    this.lastFocusedElement = null;
  }

  handleKeydown(e, closeCallback) {
    if (e.key === 'Escape') {
      if (typeof closeCallback === 'function') closeCallback();
      return;
    }
    if (e.key !== 'Tab') return;

    const focusable = e.currentTarget.querySelectorAll(FOCUSABLE_ELEMENTS_SELECTOR);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

const globalModalManager = new ModalManager();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FOCUSABLE_ELEMENTS_SELECTOR, ModalManager, globalModalManager };
}
