const sectionsToRender = [
  {
    id: '#cart-counter',
    section: 'cart-counter',
    selector: '#shopify-section-cart-counter'
  },
  {
    id: '#CartDrawer-Body',
    section: 'cart-drawer',
    selector: '#shopify-section-cart-drawer #CartDrawer-Body'
  }
];

class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.addEventListener(
      'keyup',
      event => event.code.toUpperCase() === 'ESCAPE' && this.close()
    );
    this.querySelector('#CartDrawer-Overlay').addEventListener(
      'click',
      this.close.bind(this)
    );
    this.setCartLink();
    this.parentElement.addEventListener(
      'shopify:section:select',
      () => this.open()
    );
    this.parentElement.addEventListener(
      'shopify:section:deselect',
      () => this.close()
    );
  }

  setCartLink() {
    const cartLink = document.querySelector('[data-cart-link]');
    cartLink?.setAttribute('role', 'button');
    cartLink?.setAttribute('aria-haspopup', 'dialog');
    cartLink?.addEventListener('click', event => {
      event.preventDefault();
      this.open(cartLink);
    });
    cartLink?.addEventListener('keydown', event => {
      if (event.code.toUpperCase() !== 'SPACE') return;
      event.preventDefault();
      this.open(cartLink);
    });
  }

  open(opener) {
    if (opener) this.setActiveElement(opener);
    this.classList.add('is-visible');
    this.querySelector('.cart-drawer__inner').setAttribute('aria-hidden', 'false');

    this.addEventListener('transitionend', () => {
      this.focusOnCartDrawer();
    }, { once: true });

    document.body.classList.add('overflow-hidden');
  }

  close() {
    this.classList.remove('is-visible');
    removeTrapFocus(this.activeElement);

    const isHeaderMenuOpen = header.classList.contains('menu-open');

    if (isHeaderMenuOpen) {
      return;
    }

    document.body.classList.remove('overflow-hidden');

    // if we are on the cart page, resubmit form
    if (window.location.pathname === '/cart') {
      const cartDrawerForm = document.getElementById('CartDrawer-FormSummary');
      if (cartDrawerForm) {
        cartDrawerForm.submit();
      }
    }
  }

  setActiveElement(element) {
    this.activeElement = element;
  }

  renderContents(response, open = true) {
    this.getSectionsToRender()?.forEach(section => {
      const sectionElement = document.querySelector(section.id);
      sectionElement.innerHTML = this.getSectionInnerHTML(
        response.sections[section.section],
        section.selector
      );
    });
    if (!open) {
      return;
    }

    this.open();
  }

  getSectionsToRender() {
    return sectionsToRender;
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector).innerHTML;
  }

  focusOnCartDrawer() {
    const cartDrawer = this.querySelector('.cart-drawer');
    if (cartDrawer) {
      // cartDrawer.setAttribute('tabindex', '0');
      cartDrawer.focus();
    }
  }
}

customElements.define('cart-drawer', CartDrawer);

class CartDrawerItems extends CartItems {
  getSectionsToRender() {
    return sectionsToRender;
  }
}

customElements.define('cart-drawer-items', CartDrawerItems);
