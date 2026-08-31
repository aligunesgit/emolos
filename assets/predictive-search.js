if (!customElements.get('predictive-search')) {
  class PredictiveSearch extends HTMLElement {
    constructor() {
      super();

      this.input = this.querySelector('input[type="search"]');
      this.resultsContainer = this.querySelector(
        '.js-results-container'
      );
      this.btnSubmit = this.querySelector('.js-btn-submit');
      this.btnClearText = this.querySelector('.js-btn-clear-text');
      this.errorMessageContainer = this.querySelector(
        '.js-message-error'
      );
      this.errorMessageText =
        this.errorMessageContainer.querySelector('[data-text]');
      this.timeout = null;
      this.isOpen = false;
      this.drawer = this.closest('.js-drawer');

      this.input.addEventListener('input', e => {
        clearTimeout(this.timeout);

        this.timeout = setTimeout(() => {
          const searchTerm = this.input.value.trim();

          if (searchTerm.length <= 0) {
            this.close();

            return;
          }

          this.isOpen = true;

          this.getSearchResults(searchTerm);
        }, 300);
      });

      this.input.addEventListener('keydown', e => {
        const isEscape = e.key === 'Escape';

        if (!isEscape) {
          return;
        }

        if (!this.input.value) {
          if (this.drawer) {
            this.drawer.parentElement.parentElement.toggleDrawer();
          }

          return;
        }

        this.close();
      });

      this.btnClearText.addEventListener('click', e => {
        this.close();
      });
    }

    async getSearchResults(searchTerm) {
      try {
        const response = await fetch(
          `${Shopify.routes.root}search/suggest?q=${searchTerm}&resources[type]=product,page,article,collection,query&resources[limit]=8&section_id=predictive-search`
        );

        if (!this.isOpen) {
          return;
        }

        if (!response.ok) {
          const error = new Error(response.status);

          throw error;
        }

        const text = await response.text();
        const resultsMarkup = new DOMParser()
          .parseFromString(text, 'text/html')
          .querySelector(
            '#shopify-section-predictive-search'
          ).innerHTML;

        this.resultsContainer.innerHTML = resultsMarkup;
        this.open();
      } catch (error) {
        this.errorMessageText.textContent = error.message;
        this.errorMessageContainer.classList.remove('hidden');
      }
    }

    open() {
      this.classList.add('is-open');
      this.resultsContainer.classList.remove('hidden');
      this.errorMessageContainer.classList.add('hidden');
      this.btnSubmit.setAttribute('tabindex', '-1');
      this.btnClearText.removeAttribute('disabled');
    }

    close() {
      this.isOpen = false;
      this.classList.remove('is-open');
      this.resultsContainer.classList.add('hidden');
      this.errorMessageContainer.classList.add('hidden');
      this.input.value = '';
      this.input.focus();
      this.btnSubmit.removeAttribute('tabindex');
      this.btnClearText.setAttribute('disabled', true);
    }
  }

  customElements.define('predictive-search', PredictiveSearch);
}
