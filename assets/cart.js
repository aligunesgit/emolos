class CartRemoveButton extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', event => {
      event.preventDefault();
      const cartItems =
        this.closest('cart-drawer-items') ||
        this.closest('cart-items');
      cartItems.updateQuantity(this.dataset.index, 0);
    });
  }
}
customElements.define('cart-remove-button', CartRemoveButton);

class ProgressBar extends HTMLElement {
  constructor() {
    super();
    this.progress = this.getAttribute('data-progress');
  }

  connectedCallback() {
    setTimeout(() => {
      this.querySelector('[data-progress-line]').style.width = this.progress;
    }, 100);
  }
}
customElements.define('progress-bar', ProgressBar);

class CartItems extends HTMLElement {
  constructor() {
    super();
    this.currentItemCount = Array.from(
      this.querySelectorAll('[name="updates[]"]')
    ).reduce(
      (total, quantityInput) => total + parseInt(quantityInput.value),
      0
    );
    this.debouncedOnChange = debounce(event => {
      this.onChange(event);
    }, 300);
    this.addEventListener(
      'change',
      this.debouncedOnChange.bind(this)
    );

    updateFreeShipping();
  }

  onChange(event) {
    if (event.target.name !== 'updates[]') return;

    this.updateQuantity(
      event.target.dataset.index,
      event.target.value,
      document.activeElement.getAttribute('name')
    );
  }

  getSectionsToRender() {
    return [
      {
        id: `#shopify-section-${
          document.getElementById('main-cart-items').dataset.id
        }`,
        section:
          document.getElementById('main-cart-items').dataset.id,
        selector: `#shopify-section-${
          document.getElementById('main-cart-items').dataset.id
        } cart-items`
      },
      {
        id: '#cart-counter',
        section: 'cart-counter',
        selector: '#shopify-section-cart-counter'
      }
    ];
  }

  updateQuantity(line, quantity, name) {
    this.classList.add('is-loading');

    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map(
        section => section.section
      ),
      sections_url: window.location.pathname
    });

    fetch(`${routes.cart_change_url}`, {
      ...fetchConfig(),
      ...{ body }
    })
      .then(response => response.text())
      .then(state => {
        const parsedState = JSON.parse(state);

        this.getSectionsToRender()?.forEach(section => {
          const elementToReplace = document.querySelector(section.selector) || document.querySelector(section.id);


          if (elementToReplace) {
            if (!parsedState.errors) {
              elementToReplace.innerHTML = this.getSectionInnerHTML(
                parsedState.sections[section.section],
                section.selector
              );
            }
          } else {
            console.error(`Element with selector ${section.selector} not found`);
          }
        });
        this.updateLiveRegions(line, parsedState.item_count);
        const lineItem = document.getElementById(`CartItem-${line}`);
        if (lineItem && lineItem.querySelector(`[name="${name}"]`))
          lineItem.querySelector(`[name="${name}"]`).focus();

        updateFreeShipping();
      })
      .finally(() => this.classList.remove('is-loading'));
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector).innerHTML;
  }

  updateLiveRegions(line, itemCount) {
    if (this.currentItemCount === itemCount) {
      document
        .querySelectorAll(
          `[data-line-item-error][data-line="${line}"]`
        )
        .forEach(error => {
          error.innerHTML = window.theme.strings.cartQuantityError.replace(
            '[quantity]',
            document.querySelector(`[id*="ProductQuantity-${line}"]`).value
          );
        });
    }

    this.currentItemCount = itemCount;
  }
}

customElements.define('cart-items', CartItems);
