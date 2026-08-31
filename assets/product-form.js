(() => {
  if (customElements.get('product-form')) {
    return;
  }

  class ProductForm extends HTMLElement {
    constructor() {
      super();
      this.form = this.querySelector('form');
      this.submitButton = this.form.querySelector('[name="add"]');
      this.cartDrawer = document.querySelector('cart-drawer');
      this.productBar = document.querySelector(
        `#ProductBar-${this.dataset.sectionId}`
      );

      this.form.addEventListener(
        'submit',
        this.onSubmitHandler.bind(this)
      );
    }

    onSubmitHandler(event) {
      event.preventDefault();
      const purchaseOptions = document.querySelector(
        'purchase-options'
      );
      if (
        !!purchaseOptions &&
        !purchaseOptions.isOneTimePurchase() &&
        !this.hasAttribute('data-has-selling-plan')
      ) {
        purchaseOptions.showError();
        return;
      }

      this.submitButton.classList.add('disabled');

      const config = fetchConfig('javascript');
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];
      const formData = new FormData(this.form);
      if (this.hasAttribute('data-has-pre-order')) {
        formData.append('properties[Pre-order]', '✓');
      }
      formData.append(
        'sections',
        this.cartDrawer
          .getSectionsToRender()
          .map(section => section.section)
      );
      formData.append('sections_url', window.location.pathname);
      config.body = formData;

      fetch(`${routes.cart_add_url}`, config)
        .then(response => response.json())
        .then(response => {
          if (response.status) {
            this.handleErrorMessage(response.description);
            return;
          }

          this.cartDrawer.renderContents(response);
        })
        .catch(error => {
          console.error(error);
        })
        .finally(() => {
          this.submitButton.classList.remove('disabled');
        });
    }

    handleErrorMessage(errorMessage = false) {
      const errorWrapper = this.querySelector('[data-error-wrapper]');
      if (!errorWrapper) return;

      let message = errorMessage;

      if (typeof errorMessage === 'object' && errorMessage !== null) {
        message = Object.values(errorMessage).flat().join(', ');
      }

      errorWrapper.classList.toggle('hidden', !message);
      errorWrapper.textContent = message || '';
    }


    toggleAddButton(disable, text) {
      [
        this.submitButton,
        this.productBar?.querySelector('[name="add"]')
      ].forEach(submitButton => {
        if (disable) {
          submitButton?.setAttribute('disabled', 'disabled');
          if (text && submitButton) submitButton.textContent = text;
        } else if (submitButton) {
          submitButton.removeAttribute('disabled');
          submitButton.textContent = this.hasAttribute(
            'data-has-selling-plan'
          )
            ? window.theme.strings.addSubscriptionToCart
            : (submitButton.textContent = this.hasAttribute(
                'data-has-pre-order'
              )
                ? window.theme.strings.preOrder
                : window.theme.strings.addToCart);
        }
      });
    }
  }

  customElements.define('product-form', ProductForm);
})();
