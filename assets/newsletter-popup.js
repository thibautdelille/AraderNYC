class NewsletterPopup extends HTMLElement {
  constructor() {
    super();
    this.dismissedKey = 'newsletter-popup-dismissed';
    this.shownKey = 'newsletter-popup-shown';
  }

  connectedCallback() {
    this.modal =
      this.querySelector('modal-dialog') ||
      document.querySelector(this.dataset.modal) ||
      document.getElementById(this.dataset.modalId);

    if (!this.modal) return;

    this.closeButton = this.modal.querySelector('[id^="ModalClose-"]');
    this._onCloseClick = () => this.persistDismissal();
    this.closeButton?.addEventListener('click', this._onCloseClick);

    this.wrapHide();

    const openedFromSubmit = this.modal.querySelector(
      '[data-newsletter-popup-success], [data-newsletter-popup-error]'
    );

    if (openedFromSubmit) {
      this.open();
      if (this.modal.querySelector('[data-newsletter-popup-success]')) {
        this.persistDismissal();
      }
      return;
    }

    if (window.Shopify?.designMode) {
      const section = this.closest('.shopify-section');
      document.addEventListener('shopify:section:select', (event) => {
        if (event.target === section) this.open();
      });
      document.addEventListener('shopify:section:deselect', (event) => {
        if (event.target === section && this._originalHide) this._originalHide();
      });
      return;
    }

    const forceShow = new URLSearchParams(window.location.search).has(
      'show_newsletter_popup'
    );

    if (forceShow) {
      this.clearSessionFlags();
    } else if (this.shouldStayHidden()) {
      return;
    }

    const delay = forceShow ? 0 : Number(this.dataset.delay || 2) * 1000;
    this.showTimeout = setTimeout(() => this.open(), delay);
  }

  disconnectedCallback() {
    if (this.showTimeout) clearTimeout(this.showTimeout);
    this.closeButton?.removeEventListener('click', this._onCloseClick);
  }

  wrapHide() {
    if (this.modal.dataset.newsletterHideWrapped === 'true') {
      this._originalHide =
        this.modal._newsletterOriginalHide || this.modal.hide.bind(this.modal);
      return;
    }

    const protoHide = Object.getPrototypeOf(this.modal).hide;
    this._originalHide =
      typeof protoHide === 'function'
        ? protoHide.bind(this.modal)
        : this.modal.hide.bind(this.modal);
    this.modal._newsletterOriginalHide = this._originalHide;

    this.modal.hide = () => {
      if (!window.Shopify?.designMode) this.persistDismissal();
      this._originalHide();
    };
    this.modal.dataset.newsletterHideWrapped = 'true';
  }

  shouldStayHidden() {
    return this.wasShownThisSession() || this.isDismissed();
  }

  wasShownThisSession() {
    try {
      return sessionStorage.getItem(this.shownKey) === '1';
    } catch (error) {
      return false;
    }
  }

  persistShownThisSession() {
    try {
      sessionStorage.setItem(this.shownKey, '1');
    } catch (error) {
      // Ignore storage errors (private browsing, etc.)
    }
  }

  isDismissed() {
    try {
      const raw = localStorage.getItem(this.dismissedKey);
      if (!raw) return false;
      const data = JSON.parse(raw);
      const expiryDays = Number(this.dataset.expiryDays || 30);
      if (!data?.dismissedAt) return false;
      const expiresAt = data.dismissedAt + expiryDays * 24 * 60 * 60 * 1000;
      return Date.now() < expiresAt;
    } catch (error) {
      return false;
    }
  }

  persistDismissal() {
    this.persistShownThisSession();
    try {
      localStorage.setItem(
        this.dismissedKey,
        JSON.stringify({ dismissedAt: Date.now() })
      );
    } catch (error) {
      // Ignore storage errors (private browsing, etc.)
    }
  }

  clearSessionFlags() {
    try {
      sessionStorage.removeItem(this.shownKey);
      localStorage.removeItem(this.dismissedKey);
    } catch (error) {
      // Ignore storage errors
    }
  }

  open() {
    if (!this.modal) return;
    if (!window.Shopify?.designMode) this.persistShownThisSession();
    this.modal.show(this.closeButton);
  }
}

customElements.define('newsletter-popup', NewsletterPopup);
