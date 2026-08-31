if (!customElements.get('quick-order-list')) {
  customElements.define(
    'quick-order-list',
    class QuickOrderList extends BulkAdd {
      cartUpdateUnsubscriber = undefined;
      hasPendingQuantityUpdate = false;
      constructor() {
        super();
        this.isListInsideModal = this.closest('modal-dialog') || this.dataset.bulkMode === 'true';

        this.stickyHeaderElement = document.querySelector('sticky-header');
        if (this.stickyHeaderElement) {
          this.stickyHeader = {
            height: this.stickyHeaderElement.offsetHeight,
            type: `${this.stickyHeaderElement.getAttribute('data-sticky-type')}`,
          };
        }

        this.totalBar = this.getTotalBar();
        if (this.totalBar) {
          this.totalBarPosition = window.innerHeight - this.totalBar.offsetHeight;

          this.handleResize = this.handleResize.bind(this);
          window.addEventListener('resize', this.handleResize);
        }

        const form = this.querySelector('form');
        if (form) {
          form.addEventListener('submit', (event) => event.preventDefault());
        }
      }

      connectedCallback() {
        if (!this.isListInsideModal) {
          this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, async (event) => {
            if (event.source === this.id) return;

            this.toggleTableLoading(true);
            await this.refresh();
            this.toggleTableLoading(false);
          });
        }

        this.initEventListeners();
      }

      disconnectedCallback() {
        this.cartUpdateUnsubscriber?.();
        window.removeEventListener('resize', this.handleResize);
      }

      handleResize() {
        this.totalBarPosition = window.innerHeight - this.totalBar.offsetHeight;
        this.stickyHeader.height = this.stickyHeaderElement ? this.stickyHeaderElement.offsetHeight : 0;
      }

      initEventListeners() {
        this.querySelectorAll('.pagination__item').forEach((link) => {
          link.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();

            const url = new URL(event.currentTarget.href);

            this.toggleTableLoading(true);
            await this.refresh(url.searchParams.get('page') || '1');
            this.scrollTop();
            this.toggleTableLoading(false);
          });
        });

        const contents = this.querySelector('.quick-order-list__contents');
        if (contents) {
          contents.addEventListener(
            'keyup',
            this.handleScrollIntoView.bind(this)
          );
        }

        if (this.quickOrderListTable) {
          this.quickOrderListTable.addEventListener('keydown', this.handleSwitchVariantOnEnter.bind(this));
        }

        this.initVariantEventListeners();
        this.initAddToCartButton();
      }

      initAddToCartButton() {
        const addToCartButton = this.querySelector('.quick-order-list__add-to-cart');
        if (!addToCartButton || addToCartButton.hasAttribute('data-initialized')) return;

        addToCartButton.setAttribute('data-initialized', 'true');
        addToCartButton.addEventListener('click', async (event) => {
          event.preventDefault();
          await this.addAllItemsToCart(addToCartButton);
        });

        this.initQuantityChangeListeners();
      }

      initQuantityChangeListeners() {
        this.querySelectorAll('quick-add-bulk quantity-input').forEach((quantityInput) => {
          const input = quantityInput.querySelector('input');
          if (input) {
            input.addEventListener('input', () => {
              this.updateAddToCartButtonState();
              this.updateRowPrice(input);
              this.showApiError(null);
            });
          }
          quantityInput.addEventListener('change', () => {
            this.updateAddToCartButtonState();
            const inputEl = quantityInput.querySelector('input');
            if (inputEl) this.updateRowPrice(inputEl);
          });
        });
      }

      updateRowPrice(input) {
        const row = input.closest('tr');
        if (!row) return;

        const quantity = parseInt(input.value, 10) || 0;
        const priceCell = row.querySelector('.quick-order-list__price');
        if (!priceCell) return;

        const priceTarget = priceCell.querySelector('[data-current-price]');
        if (!priceTarget) return;

        const basePrice = priceCell.dataset.basePrice || priceTarget.textContent;
        let displayPrice = basePrice;

        const tierScript = priceCell.querySelector('script[data-tier-breaks]');
        if (tierScript && quantity > 0) {
          try {
            const tiers = JSON.parse(tierScript.textContent);
            const applicable = tiers
              .filter((t) => quantity >= t.min)
              .sort((a, b) => b.min - a.min)[0];
            if (applicable) displayPrice = applicable.price;
          } catch (_) {}
        }
        priceTarget.textContent = displayPrice;
      }

      showApiError(message) {
        const errorEl = this.querySelector('[data-quick-order-list-error]');
        if (!errorEl) return;
        if (!message) {
          errorEl.textContent = '';
          errorEl.setAttribute('hidden', '');
          return;
        }
        errorEl.textContent = message;
        errorEl.removeAttribute('hidden');
      }

      updateAddToCartButtonState() {
        const addToCartButton = this.querySelector('.quick-order-list__add-to-cart');
        if (!addToCartButton) return;

        const totalQuantity = this.getTotalQuantity();
        addToCartButton.disabled = totalQuantity === 0;
      }

      getTotalQuantity() {
        let total = 0;
        this.querySelectorAll('quick-add-bulk quantity-input input').forEach((input) => {
          total += parseInt(input.value, 10) || 0;
        });
        return total;
      }

      async addAllItemsToCart(button) {
        this.showApiError(null);

        const items = [];
        const ruleErrors = [];
        const quickAddBulkElements = this.querySelectorAll('quick-add-bulk');

        quickAddBulkElements.forEach((element) => {
          const input = element.querySelector('quantity-input input');
          if (!input) return;

          const quantity = parseInt(input.value, 10);
          const variantId = element.dataset.index;
          if (!(quantity > 0 && variantId)) return;

          const ruleMin = parseInt(element.dataset.min, 10) || 1;
          const ruleStep = parseInt(element.dataset.step, 10) || 1;
          const ruleMax = element.dataset.max ? parseInt(element.dataset.max, 10) : null;

          const violations = [];
          if (quantity < ruleMin && element.dataset.ruleMinMessage) {
            violations.push(element.dataset.ruleMinMessage);
          }
          if (ruleMax !== null && quantity > ruleMax && element.dataset.ruleMaxMessage) {
            violations.push(element.dataset.ruleMaxMessage);
          }
          if (ruleStep > 1 && (quantity - ruleMin) % ruleStep !== 0 && element.dataset.ruleStepMessage) {
            violations.push(element.dataset.ruleStepMessage);
          }

          if (violations.length > 0) {
            const variantTitle = element.dataset.variantTitle;
            const prefix = variantTitle && variantTitle !== 'Default Title' ? `${variantTitle}: ` : '';
            ruleErrors.push(`${prefix}${violations.join(' · ')}`);
            return;
          }

          items.push({
            id: parseInt(variantId, 10),
            quantity: quantity,
          });
        });

        if (ruleErrors.length > 0) {
          this.showApiError(ruleErrors.join(' | '));
          return;
        }

        if (items.length === 0) {
          const modal = this.closest('modal-dialog');
          if (modal) modal.hide();
          return;
        }

        button.classList.add('disabled');
        button.disabled = true;
        this.toggleLoading(true);

        try {
          const cartDrawer = document.querySelector('cart-drawer');
          const sectionsToFetch = cartDrawer
            ? cartDrawer.getSectionsToRender().map((s) => s.section)
            : [];

          const response = await fetch(routes.cart_add_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              items: items,
              sections: sectionsToFetch,
              sections_url: window.location.pathname,
            }),
          });

          const result = await response.json();

          if (result.status) {
            const message = result.description || result.message || (window.cartStrings && window.cartStrings.error);
            this.showApiError(message);
            return;
          }

          this.querySelectorAll('quick-add-bulk quantity-input input').forEach((input) => {
            input.value = 0;
            const quantityComponent = input.closest('quantity-input');
            if (quantityComponent && quantityComponent.updateButtonColors) {
              quantityComponent.updateButtonColors();
            }
            this.updateRowPrice(input);
          });

          if (cartDrawer && result.sections) {
            cartDrawer.renderContents(result);
          }

          const modal = this.closest('modal-dialog');
          if (modal) modal.hide();

          if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
            publish(PUB_SUB_EVENTS.cartUpdate, { source: 'quick-order-list', cartData: result });
          }
        } catch (error) {
          console.error('Error adding to cart:', error);
          this.showApiError(window.cartStrings && window.cartStrings.error);
        } finally {
          button.classList.remove('disabled');
          button.disabled = false;
          this.toggleLoading(false);
        }
      }

      initVariantEventListeners() {
        this.allInputsArray = Array.from(this.querySelectorAll('input[type="number"]'));

        if (!this.isListInsideModal) {
          this.querySelectorAll('quantity-input').forEach((qty) => {
            const debouncedOnChange = debounce(this.onChange.bind(this), BulkAdd.ASYNC_REQUEST_DELAY, true);
            qty.addEventListener('change', (event) => {
              this.hasPendingQuantityUpdate = true;
              debouncedOnChange(event);
            });
          });

          this.querySelectorAll('.quick-order-list-remove-button').forEach((button) => {
            button.addEventListener('click', (event) => {
              event.preventDefault();
              this.toggleLoading(true);
              this.startQueue(button.dataset.index, 0);
            });
          });
        }
      }

      get currentPage() {
        return this.querySelector('.pagination-wrapper')?.dataset?.page ?? '1';
      }

      get cartVariantsForProduct() {
        return JSON.parse(this.querySelector('[data-cart-contents]')?.innerHTML || '[]');
      }

      onChange(event) {
        const inputValue = parseInt(event.target.value);
        this.cleanErrorMessageOnType(event);
        if (inputValue == 0) {
          event.target.setAttribute('value', inputValue);
          this.startQueue(event.target.dataset.index, inputValue);
        } else {
          this.validateQuantity(event);
        }
      }

      cleanErrorMessageOnType(event) {
        const handleKeydown = () => {
          event.target.setCustomValidity(' ');
          event.target.reportValidity();
          event.target.removeEventListener('keydown', handleKeydown);
        };

        event.target.addEventListener('keydown', handleKeydown);
      }

      validateInput(target) {
        const targetValue = parseInt(target.value);
        const targetMin = parseInt(target.dataset.min);
        const targetStep = parseInt(target.step);

        if (target.max) {
          return (
            targetValue == 0 ||
            (targetValue >= targetMin && targetValue <= parseInt(target.max) && targetValue % targetStep == 0)
          );
        } else {
          return targetValue == 0 || (targetValue >= targetMin && targetValue % targetStep == 0);
        }
      }

      get quickOrderListTable() {
        return this.querySelector('.quick-order-list__table');
      }

      getSectionsToRender() {
        return [
          {
            id: this.id,
            section: this.dataset.section,
            selector: `#${this.id}`,
          },
          {
            id: 'cart-icon-bubble',
            section: 'cart-icon-bubble',
            selector: '#shopify-section-cart-icon-bubble',
          },
          {
            id: `quick-order-list-live-region-text-${this.dataset.productId}`,
            section: 'cart-live-region-text',
            selector: '.shopify-section',
          },
          {
            id: 'CartDrawer',
            selector: '.drawer__inner',
            section: 'cart-drawer',
          },
        ];
      }

      toggleTableLoading(enable) {
        if (this.quickOrderListTable) {
          this.quickOrderListTable.classList.toggle('quick-order-list__container--disabled', enable);
        }
        this.toggleLoading(enable);
      }

      async refresh(pageNumber = null) {
        const url = this.dataset.url || window.location.pathname;

        return fetch(`${url}?section_id=${this.dataset.section}&page=${pageNumber || this.currentPage}`)
          .then((response) => response.text())
          .then((responseText) => {
            const html = new DOMParser().parseFromString(responseText, 'text/html');
            const responseQuickOrderList = html.querySelector(`#${this.id}`);

            if (!responseQuickOrderList) {
              return;
            }

            this.innerHTML = responseQuickOrderList.innerHTML;
            this.initEventListeners();
          })
          .catch((e) => {
            console.error(e);
          });
      }

      renderSections(parsedState) {
        const { items, sections } = parsedState;

        this.getSectionsToRender().forEach(({ id, selector, section }) => {
          const sectionElement = document.getElementById(id);
          if (!sectionElement) return;

          const newSection = new DOMParser().parseFromString(sections[section], 'text/html').querySelector(selector);

          if (section === this.dataset.section) {
            if (this.queue.length > 0 || this.hasPendingQuantityUpdate) return;

            const focusedElement = document.activeElement;
            let focusTarget = focusedElement?.dataset?.target;
            if (focusTarget?.includes('remove')) {
              focusTarget = focusedElement.closest('quantity-popover')?.querySelector('[data-target*="increment-"]')
                ?.dataset.target;
            }

            const total = this.getTotalBar();
            if (total) {
              total.innerHTML = newSection.querySelector('.quick-order-list__total').innerHTML;
            }

            const table = this.quickOrderListTable;
            const newTable = newSection.querySelector('.quick-order-list__table');

            // only update variants if they are from the active page
            const shouldUpdateVariants =
              this.currentPage === (newSection.querySelector('.pagination-wrapper')?.dataset.page ?? '1');
            if (newTable && shouldUpdateVariants) {
              table.innerHTML = newTable.innerHTML;

              const newFocusTarget = this.querySelector(`[data-target='${focusTarget}']`);
              if (newFocusTarget) {
                newFocusTarget?.focus({ preventScroll: true });
              }

              this.initVariantEventListeners();
            }
          } else if (section === 'cart-drawer') {
            sectionElement.closest('cart-drawer')?.classList.toggle('is-empty', items.length === 0);
            sectionElement.querySelector(selector).innerHTML = newSection.innerHTML;
          } else {
            sectionElement.innerHTML = newSection.innerHTML;
          }
        });
      }

      getTotalBar() {
        return this.querySelector('.quick-order-list__total');
      }

      scrollTop() {
        const { top } = this.getBoundingClientRect();

        if (this.isListInsideModal) {
          this.scrollIntoView();
        } else {
          window.scrollTo({ top: top + window.scrollY - (this.stickyHeader?.height || 0), behavior: 'instant' });
        }
      }

      scrollQuickOrderListTable(target) {
        const inputTopBorder = target.getBoundingClientRect().top;
        const inputBottomBorder = target.getBoundingClientRect().bottom;

        if (this.isListInsideModal) {
          const totalBarCrossesInput = inputBottomBorder > this.totalBar.getBoundingClientRect().top;
          const tableHeadCrossesInput =
            inputTopBorder < this.querySelector('.quick-order-list__table thead').getBoundingClientRect().bottom;

          if (totalBarCrossesInput || tableHeadCrossesInput) {
            this.scrollToCenter(target);
          }
        } else {
          const stickyHeaderBottomBorder = this.stickyHeaderElement?.getBoundingClientRect().bottom;
          const totalBarCrossesInput = inputBottomBorder > this.totalBarPosition;
          const inputOutsideOfViewPort =
            inputBottomBorder < this.querySelector('.variant-item__quantity-wrapper').offsetHeight;
          const stickyHeaderCrossesInput =
            this.stickyHeaderElement &&
            this.stickyHeader.type !== 'on-scroll-up' &&
            this.stickyHeader.height > inputTopBorder;
          const stickyHeaderScrollupCrossesInput =
            this.stickyHeaderElement &&
            this.stickyHeader.type === 'on-scroll-up' &&
            this.stickyHeader.height > inputTopBorder &&
            stickyHeaderBottomBorder > 0;

          if (
            totalBarCrossesInput ||
            inputOutsideOfViewPort ||
            stickyHeaderCrossesInput ||
            stickyHeaderScrollupCrossesInput
          ) {
            this.scrollToCenter(target);
          }
        }
      }

      scrollToCenter(target) {
        target.scrollIntoView({
          block: 'center',
          behavior: 'smooth',
        });
      }

      handleScrollIntoView(event) {
        if ((event.key === 'Tab' || event.key === 'Enter') && this.allInputsArray.length !== 1) {
          this.scrollQuickOrderListTable(event.target);
        }
      }

      handleSwitchVariantOnEnter(event) {
        if (event.key !== 'Enter' || event.target.tagName !== 'INPUT') return;

        event.preventDefault();
        event.target.blur();

        if (!this.validateInput(event.target) || this.allInputsArray.length <= 1) return;

        const currentIndex = this.allInputsArray.indexOf(event.target);
        const offset = event.shiftKey ? -1 : 1;
        const nextIndex = (currentIndex + offset + this.allInputsArray.length) % this.allInputsArray.length;

        this.allInputsArray[nextIndex]?.select();
      }

      updateMultipleQty(items) {
        if (this.queue.length == 0) this.hasPendingQuantityUpdate = false;

        this.toggleLoading(true);
        const url = this.dataset.url || window.location.pathname;

        const body = JSON.stringify({
          updates: items,
          sections: this.getSectionsToRender().map(({ section }) => section),
          sections_url: `${url}?page=${this.currentPage}`,
        });

        this.updateMessage();
        this.setErrorMessage();

        fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } })
          .then((response) => response.text())
          .then(async (state) => {
            const parsedState = JSON.parse(state);
            this.renderSections(parsedState);
            publish(PUB_SUB_EVENTS.cartUpdate, {
              source: this.id,
              cartData: parsedState,
            });
          })
          .catch((e) => {
            console.error(e);
            this.setErrorMessage(window.cartStrings.error);
          })
          .finally(() => {
            this.queue.length === 0 && this.toggleLoading(false);
            this.setRequestStarted(false);
          });
      }

      setErrorMessage(message = null) {
        if (!this.errorMessageTemplate) {
          const templateEl = document.getElementById(`QuickOrderListErrorTemplate-${this.dataset.productId}`);
          if (templateEl) {
            this.errorMessageTemplate = templateEl.cloneNode(true);
          }
        }

        const errorElements = document.querySelectorAll('.quick-order-list-error');

        errorElements.forEach((errorElement) => {
          errorElement.innerHTML = '';
          if (!message || !this.errorMessageTemplate) return;
          const updatedMessageElement = this.errorMessageTemplate.cloneNode(true);
          const messageEl = updatedMessageElement.content?.querySelector('.quick-order-list-error-message');
          if (messageEl) {
            messageEl.innerText = message;
            errorElement.appendChild(updatedMessageElement.content);
          }
        });
      }

      updateMessage(quantity = null) {
        const messages = this.querySelectorAll('.quick-order-list__message-text');
        const icons = this.querySelectorAll('.quick-order-list__message-icon');

        if (quantity === null || isNaN(quantity)) {
          messages.forEach((message) => (message.innerHTML = ''));
          icons.forEach((icon) => icon.classList.add('hidden'));
          return;
        }

        const isQuantityNegative = quantity < 0;
        const absQuantity = Math.abs(quantity);

        const textTemplate = isQuantityNegative
          ? absQuantity === 1
            ? window.quickOrderListStrings.itemRemoved
            : window.quickOrderListStrings.itemsRemoved
          : quantity === 1
          ? window.quickOrderListStrings.itemAdded
          : window.quickOrderListStrings.itemsAdded;

        messages.forEach((msg) => (msg.innerHTML = textTemplate.replace('[quantity]', absQuantity)));

        if (!isQuantityNegative) {
          icons.forEach((i) => i.classList.remove('hidden'));
        }
      }

      updateError(updatedValue, id) {
        let message = '';
        if (typeof updatedValue === 'undefined') {
          message = window.cartStrings.error;
        } else {
          message = window.cartStrings.quantityError.replace('[quantity]', updatedValue);
        }
        this.updateLiveRegions(id, message);
      }

      updateLiveRegions(id, message) {
        const variantItemErrorDesktop = document.getElementById(`Quick-order-list-item-error-desktop-${id}`);
        if (variantItemErrorDesktop) {
          variantItemErrorDesktop.querySelector('.variant-item__error-text').innerHTML = message;
          variantItemErrorDesktop.closest('tr').classList.remove('hidden');
        }
        if (variantItemErrorMobile)
          variantItemErrorMobile.querySelector('.variant-item__error-text').innerHTML = message;

        this.querySelector('#shopping-cart-variant-item-status').setAttribute('aria-hidden', true);

        const cartStatus = document.getElementById('quick-order-list-live-region-text');
        cartStatus.setAttribute('aria-hidden', false);

        setTimeout(() => {
          cartStatus.setAttribute('aria-hidden', true);
        }, 1000);
      }

      toggleLoading(loading, target = this) {
        const status = target.querySelector('#shopping-cart-variant-item-status');
        if (status) {
          status.toggleAttribute('aria-hidden', !loading);
        }
        target
          .querySelectorAll('.variant-remove-total .loading__spinner')
          ?.forEach((spinner) => spinner.classList.toggle('hidden', !loading));
      }
    }
  );
}

if (!customElements.get('quick-order-list-remove-all-button')) {
  customElements.define(
    'quick-order-list-remove-all-button',
    class QuickOrderListRemoveAllButton extends HTMLElement {
      constructor() {
        super();
        this.quickOrderList = this.closest('quick-order-list');

        this.actions = {
          confirm: 'confirm',
          remove: 'remove',
          cancel: 'cancel',
        };

        this.addEventListener('click', (event) => {
          event.preventDefault();
          if (this.dataset.action === this.actions.confirm) {
            this.toggleConfirmation(false, true);
          } else if (this.dataset.action === this.actions.remove) {
            const items = this.quickOrderList.cartVariantsForProduct.reduce(
              (acc, variantId) => ({ ...acc, [variantId]: 0 }),
              {}
            );

            this.quickOrderList.updateMultipleQty(items);
            this.toggleConfirmation(true, false);
          } else if (this.dataset.action === this.actions.cancel) {
            this.toggleConfirmation(true, false);
          }
        });
      }

      toggleConfirmation(showConfirmation, showInfo) {
        this.quickOrderList
          .querySelector('.quick-order-list-total__confirmation')
          .classList.toggle('hidden', showConfirmation);
        this.quickOrderList.querySelector('.quick-order-list-total__info').classList.toggle('hidden', showInfo);
      }
    }
  );
}
