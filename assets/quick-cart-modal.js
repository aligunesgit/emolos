if (!customElements.get('quick-cart-modal')) {
  class QuickCartModal extends HTMLElement {
    constructor() {
      super();
      if (Shopify.designMode) {
        window.addEventListener('shopify:section:load', this.init.bind(this));
        this.parentElement.addEventListener('shopify:section:select', () => this.open());
        this.parentElement.addEventListener('shopify:section:deselect', () => this.close());
      }
    }

    connectedCallback() {
      this.init();
    }

    init() {
      this.toggleState = false;

      if (!this.classList.contains('is--open')) {
        document.querySelector('body').classList.remove('overflow-hidden');
      }

      this.querySelector('.quick-cart-modal__backdrop').addEventListener('click', this.close.bind(this));

      this.querySelector('.quick-cart-modal__content').addEventListener('keydown', e => {
        if (e.key === 'Escape' && this.toggleState) {
          this.close();
        }

        if (this.toggleState) {
          const focusableElements = this.querySelectorAll(
            'button, [href], input, select, label, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstFocusableElement = focusableElements[0];
          const lastFocusableElement = focusableElements[focusableElements.length - 1];

          let isTabPressed = e.key === 'Tab';

          if (!isTabPressed) {
            return;
          }

          if (e.shiftKey) {
            if (document.activeElement === firstFocusableElement) {
              e.preventDefault();
              lastFocusableElement.focus();
            }
          } else {
            if (document.activeElement === lastFocusableElement) {
              e.preventDefault();
              firstFocusableElement.focus();
            }
          }
        }
      });

      this.initTriggers();
    }

    initTriggers() {
      // Function to attach event listeners to triggers
      const attachTriggers = () => {
        document.querySelectorAll('.quick-cart-modal__trigger').forEach(element => {
          if (!element._init) {
            element.addEventListener('click', event => {
              event.preventDefault();
              event.stopPropagation();
              this.fetchProductForQuickCartModal(event);
            });
            element._init = true;
          }
        });
      };

      // Initialize existing triggers on page load
      attachTriggers();

      // Observe for dynamically added triggers
      const observer = new MutationObserver(() => {
        attachTriggers();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    async fetchProductForQuickCartModal(event) {
      // Get the actual button element, even if SVG was clicked
      const trigger = event.currentTarget;

      /** stop autoplay on quick cart trigger */
      if (trigger.closest('card-product-slider')) {
        trigger.closest('card-product-slider').slider.autoplay.stop();
        trigger.closest('card-product-slider').classList.add('product--open-on-quick-cart');
      }

      const isRecommendations = trigger.classList.contains('quick-cart-modal__trigger--recommendations');
      const isPlpCard = !!trigger.closest('card-product');
      const skipOptionSync = isRecommendations || isPlpCard;

      const productCard = trigger.closest('product-card');
      let productOptions = null;

      if (!skipOptionSync) {
        if (!productCard) return;
        productOptions = productCard.querySelectorAll('input[type="radio"]:checked, select');
      }
      trigger.classList.toggle('is--loading');
      try {
        let fetchPrefix = '';
        if (window.Shopify.routes.root.includes(`/${window.Shopify.locale}/`)) {
          fetchPrefix = `/${window.Shopify.locale}`;
        }

        // Check if URL already has query parameters
        const productUrl = trigger.dataset.productUrl;
        if (!productUrl) return;
        const separator = productUrl.includes('?') ? '&' : '?';
        const fetchUrl = `${fetchPrefix}${productUrl}${separator}view=quick-cart-modal`;

        const productCardResponse = await fetch(fetchUrl);
        if (!productCardResponse) return;

        const productCardHTML = await productCardResponse.text();
        const productCard = document.createElement('DIV');
        productCard.insertAdjacentHTML('beforeend', productCardHTML);

        const quickCartProductModal = productCard.querySelector('.quick-cart-product-modal');
        if (!quickCartProductModal) return;

        this.querySelector('.quick-cart-modal__main').innerHTML = '';
        this.querySelector('.quick-cart-modal__main').append(quickCartProductModal);

        this.classList.toggle('quick-cart-modal--plp', isPlpCard);

        // Attach close button event listener (button is now inside the loaded content)
        const closeButtons = this.querySelectorAll('.button--close');
        closeButtons.forEach(closeButton => {
          closeButton.addEventListener('click', this.close.bind(this));
        });
      } catch (error) {
        // console.log(error);
      } finally {
        trigger.classList.toggle('is--loading');

        if (!skipOptionSync) {
          productOptions.forEach(productOption => {
            const quickCartModalOption = this.querySelector(
              `[name="${CSS.escape(productOption.name)}-quick-cart-product-modal"][value="${CSS.escape(productOption.value)}"]`
            );
            const quickCartModalOptionLabel = quickCartModalOption.parentElement.parentElement.querySelector('legend');
            const quickCartModalOptionLabelInnerHTML = quickCartModalOptionLabel.innerHTML;

            this.querySelectorAll(`[name="${productOption.name}"]`).forEach(radioInput => {
              radioInput.removeAttribute('checked');
              radioInput.closest('li').classList.remove('checked');
            });

            if (quickCartModalOption) {
              quickCartModalOption.setAttribute('checked', '');
              const quickCartModalOptionLabelSpan = quickCartModalOptionLabel.querySelector('[data-selected-variant]');
              if (quickCartModalOptionLabelSpan) {
                quickCartModalOptionLabelSpan.innerHTML = productOption.value;
              }
            }

            this.querySelector('product-card').querySelector('input[name="id"]').value =
              productCard.querySelector('input[name="id"]').value;

            if (quickCartModalOption) {
              quickCartModalOption.closest('li').classList.add('checked');
            }

            this.querySelector('product-card').init();
          });
        }

        setTimeout(() => {
          const productMediaElement = this.querySelector('product-media');
          if (productMediaElement && productMediaElement.settings && productMediaElement.settings.sliderInstance) {
            this.sliderInstance = productMediaElement.settings.sliderInstance;
          }

          this.open();
        }, 80);

        this.initVariantSelection();
        this.initFormSubmit();
        this.initSizeChart();
      }
    }

    initSizeChart() {
      const chart = this.querySelector('.quick-cart-size-chart');
      if (!chart) return;

      const open = () => {
        chart.hidden = false;
      };
      const close = event => {
        event?.preventDefault();
        event?.stopPropagation();
        chart.hidden = true;
      };

      this.querySelectorAll('.quick-cart-size-chart__trigger').forEach(trigger => {
        trigger.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          open();
        });
      });

      chart.querySelector('.quick-cart-size-chart__close')?.addEventListener('click', close);
      chart.addEventListener('click', event => {
        if (event.target === chart) close(event);
      });

      chart.querySelectorAll('.quick-cart-size-chart__unit').forEach(button => {
        button.addEventListener('click', () => {
          const unit = button.dataset.unit;
          chart.querySelectorAll('.quick-cart-size-chart__unit').forEach(el => {
            el.classList.toggle('is-active', el === button);
          });
          chart.querySelectorAll('[data-unit-table]').forEach(table => {
            table.hidden = table.dataset.unitTable !== unit;
          });
        });
      });
    }

    initVariantSelection() {
      const productCard = this.querySelector('product-card');

      if (!productCard) return;

      const productSelector = productCard.querySelector('product-selector');
      if (productSelector) return;

      const variantsJson = productCard.querySelector('[data-product-variants-json]');

      if (!variantsJson) return;

      const variants = JSON.parse(variantsJson.textContent);
      productCard.variantsObj = variants;

      this.updateOptions();

      this.updateVariant(variants);

      productCard.querySelectorAll('input[type="radio"]:checked').forEach(input => {
        input.closest('.button--variant')?.classList.add('is-active');
      });

      const radioInputs = this.querySelector('.quick-cart-modal__main')
        .querySelectorAll('.variant-option-radio-input');


      radioInputs.forEach((radioInput, index) => {

          radioInput.addEventListener('change', event => {

            const fieldset = event.target.closest('fieldset');

            if (fieldset) {
              const legend = fieldset.querySelector('legend');
              const legendSpan = legend?.querySelector('[data-selected-variant]');
              if (legendSpan) {
                legendSpan.innerHTML = event.target.value;
              }

              fieldset.querySelectorAll('.button--variant').forEach(btn => {
                btn.classList.remove('is-active');
              });

              event.target.closest('.button--variant')?.classList.add('is-active');
            }

            this.updateOptions();

            this.updateVariant(variants);

            const hiddenInput = this.querySelector(".product-card__add-to-cart--form input[name='id']");

            if (this.currentVariant && this.currentVariant.featured_media) {
              this.setActiveMedia(this.currentVariant.featured_media.id);
            }

            const submitButton = this.querySelector('.product-card__add-to-cart--form button[type="submit"]');
            if (submitButton) {
              if (this.currentVariant && this.currentVariant.available) {
                submitButton.removeAttribute('disabled');
              } else {
                submitButton.setAttribute('disabled', 'disabled');
              }
            }
          });
        });
    }

    updateOptions() {
      const productCard = this.querySelector('product-card');
      if (!productCard) return;

      this.options = Array.from(
        productCard.querySelectorAll('input[type="radio"]:checked'),
        input => ({ name: input.name, value: input.value })
      );
    }

    updateVariant(variants) {
      this.currentVariant = this.getVariantData(variants);

      if (this.currentVariant) {
        this.updateVariantInput();
      }
    }

    getVariantData(variants) {
      if (!this.options || this.options.length === 0) {
        return variants[0];
      }

      return variants.find(variant => {
        return this.options.every((option, index) => {
          return variant[`option${index + 1}`] === option.value;
        });
      });
    }

    updateVariantInput() {
      const hiddenInput = this.querySelector(".product-card__add-to-cart--form input[name='id']");

      if (hiddenInput && this.currentVariant) {
        hiddenInput.value = this.currentVariant.id;
        hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    setActiveMedia(id) {
      const mediaFound = Array.from(this.querySelectorAll('[data-media-id]')).find(media => Number(media.dataset.mediaId) === id);
      if (mediaFound) {
        this.sliderInstance.slideTo(Number(mediaFound.dataset.index));
      }
    }

    initFormSubmit() {
      const form = this.querySelector('.product-card__add-to-cart--form');
      if (!form) return;

      if (this.formSubmitHandler) {
        form.removeEventListener('submit', this.formSubmitHandler);
      }

      this.formSubmitHandler = async (event) => {
        event.preventDefault();

        const submitButton = form.querySelector('button[type="submit"]');
        const cartDrawer = document.querySelector('cart-drawer');

        if (!submitButton || !cartDrawer) return;

        submitButton.classList.add('disabled');

        try {
          const formData = new FormData(form);
          formData.append(
            'sections',
            cartDrawer.getSectionsToRender().map(section => section.section)
          );
          formData.append('sections_url', window.location.pathname);

          const config = fetchConfig('javascript');
          config.headers['X-Requested-With'] = 'XMLHttpRequest';
          delete config.headers['Content-Type'];
          config.body = formData;

          const response = await fetch(`${routes.cart_add_url}`, config);
          const data = await response.json();

          if (data.status) {
            console.error(data.description);
            return;
          }
          cartDrawer.renderContents(data, false);
          this.close();

        } catch (error) {
          console.error(error);
        } finally {
          submitButton.classList.remove('disabled');
        }
      };

      form.addEventListener('submit', this.formSubmitHandler);
    }

    /** Modal core functions */
    toggle() {
      if (!this.toggleState) {
        this.open();
      } else {
        this.close();
      }
    }

    open() {
      this.toggleState = true;
      document.querySelector('body').classList.add('overflow-hidden');
      const quickCartModal = document.querySelector('.quick-cart-modal__content');
      quickCartModal.setAttribute('tabindex', '0');

      // Close button is now inside dynamically loaded content
      const closeButtons = this.querySelectorAll('.button--close');
      closeButtons.forEach(closeButton => {
        closeButton.setAttribute('tabindex', '0');
      });

      this.classList.add('is--open');
      this.opened();

      const firstFocusableElement = this.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusableElement) {
        firstFocusableElement.focus();
      }
    }

    close() {
      this.toggleState = false;

      const shopTheLookDrawer = document.querySelector('shop-the-look-drawer');

      if (shopTheLookDrawer && !shopTheLookDrawer.classList.contains('is--open')) {
        document.querySelector('body').classList.remove('overflow-hidden');
      }
      if (!shopTheLookDrawer) {
        document.querySelector('body').classList.remove('overflow-hidden');
      }
      this.classList.remove('is--open');
      const sizeChart = this.querySelector('.quick-cart-size-chart');
      if (sizeChart) sizeChart.hidden = true;
      this.closed();
      this.toggleAriaExpanded();

      /** start autoplay on quick cart modal close */
      if (document.querySelector('card-product-slider.product--open-on-quick-cart')) {
        document.querySelector('card-product-slider.product--open-on-quick-cart').slider.autoplay.start();
        document.querySelector('card-product-slider.product--open-on-quick-cart').classList.remove('product--open-on-quick-cart');
      }
    }

    toggleAriaExpanded(event) {
      if (event) {
        if (event.target.closest('button')) event.target.closest('button').setAttribute('aria-expanded', true);
        this.querySelector('.button--close').setAttribute('aria-expanded', true);
      } else {
        document.querySelectorAll('[aria-controls="quick-cart-modal"]').forEach(button => {
          button.setAttribute('aria-expanded', false);
        });
      }
    }

    opened() {
      const openedEvent = new Event('opened', { bubbles: true });
      this.dispatchEvent(openedEvent);
    }

    closed() {
      const closedEvent = new Event('closed', { bubbles: true });
      this.dispatchEvent(closedEvent);
    }
  }

  customElements.define('quick-cart-modal', QuickCartModal);
}
