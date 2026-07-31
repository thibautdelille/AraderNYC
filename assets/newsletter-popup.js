class NewsletterPopup extends HTMLElement {
  constructor() {
    super();
    this.storageKey = 'newsletter-popup-dismissed';
  }

  connectedCallback() {
    this.modal =
      this.querySelector('modal-dialog') ||
      document.querySelector(this.dataset.modal) ||
      document.getElementById(this.dataset.modalId);

    if (!this.modal) return;

    this.closeButton = this.modal.querySelector('[id^="ModalClose-"]');

    if (!this.modal.dataset.newsletterHideWrapped) {
      this.modal.dataset.newsletterHideWrapped = 'true';
      const originalHide = this.modal.hide.bind(this.modal);
      this.modal.hide = () => {
        if (!window.Shopify?.designMode) this.persistDismissal();
        originalHide();
      };
      this._originalHide = originalHide;
    }

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
      try {
        localStorage.removeItem(this.storageKey);
      } catch (error) {
        // Ignore storage errors
      }
    } else if (this.isDismissed()) {
      return;
    }

    const delay = forceShow ? 0 : Number(this.dataset.delay || 2) * 1000;
    this.showTimeout = setTimeout(() => this.open(), delay);
  }

  disconnectedCallback() {
    if (this.showTimeout) clearTimeout(this.showTimeout);
  }

  isDismissed() {
    try {
      const raw = localStorage.getItem(this.storageKey);
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
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify({ dismissedAt: Date.now() })
      );
    } catch (error) {
      // Ignore storage errors (private browsing, etc.)
    }
  }

  open() {
    if (!this.modal) return;
    this.modal.show(this.closeButton);
  }
}

customElements.define('newsletter-popup', NewsletterPopup);
