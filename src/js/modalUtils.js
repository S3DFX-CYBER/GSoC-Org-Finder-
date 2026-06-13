const FOCUSABLE_ELEMENTS_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

class ModalManager {
  lastFocusedElement = null;
  activeHandlers = new WeakMap();

  setLastFocusedElement(element) {
    this.lastFocusedElement = element;
  }

  restoreFocus() {
    if (this.lastFocusedElement && document.contains(this.lastFocusedElement)) {
      this.lastFocusedElement.focus();
    }
    this.lastFocusedElement = null;
  }

  bindModalKeydown(modalElement, closeCallback) {
    if (!modalElement) return;
    this.unbindModalKeydown(modalElement);
    const handler = (e) => this.handleKeydown(e, closeCallback);
    this.activeHandlers.set(modalElement, handler);
    modalElement.addEventListener('keydown', handler);
  }

  unbindModalKeydown(modalElement) {
    if (!modalElement) return;
    const handler = this.activeHandlers.get(modalElement);
    if (handler) {
      modalElement.removeEventListener('keydown', handler);
      this.activeHandlers.delete(modalElement);
    }
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
