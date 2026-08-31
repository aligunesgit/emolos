if (!customElements.get('card-product')) {
  class CardProduct extends HTMLElement {
    constructor() {
      super();

      if (this.classList.contains('disabled')) {
        return;
      }

      this.swatches = this.querySelector('.js-swatches');
      this.btnToggleSizes = this.querySelector(
        '.js-btn-toggle-sizes'
      );
      this.defaultMedia = this.querySelector('.js-media-default');

      if (this.btnToggleSizes) {
        this.cartDrawer = document.querySelector('cart-drawer');

        this.duplicateSizes();
        this.setAccessibility();

        this.initialSizeBtns =
          this.sizesContent.querySelectorAll('.js-btn-size');
        this.duplicateSizeBtns =
          this.duplicatedSizesContent.querySelectorAll(
            '.js-btn-size'
          );
        this.sizeBtns = [
          ...this.initialSizeBtns,
          ...this.duplicateSizeBtns
        ];

        if (this.swatches) {
          this.swatches.addEventListener('click', e => {
            const variantId = e.target.getAttribute('data-variant');

            if (variantId) {
              const closestProductCardMedia = e.target.closest('.relative')?.querySelector('.card-product__media');
              const closestProductCardContent = e.target.closest('card-product').querySelector('.card-product__content');

              if (closestProductCardMedia) {
                const currentUrlMedia = closestProductCardMedia.href.split('?')[0];
                const newUrlMedia = currentUrlMedia + '?variant=' + variantId;
                closestProductCardMedia.href = newUrlMedia;
              }

              if (closestProductCardContent) {
                const currentUrlContent = closestProductCardContent.href.split('?')[0];
                const newUrlContent = currentUrlContent + '?variant=' + variantId;
                closestProductCardContent.href = newUrlContent;
              }
            }
          });
        }

        this.btnToggleSizes.addEventListener('click', e => {
          e.preventDefault();

          if (!this.duplicatedSizesContainer) {
            return;
          }

          const btnId = this.btnToggleSizes.dataset.id;
          const sizesContent =
            this.duplicatedSizesContainer.querySelector(
              `.js-sizes-content[data-id="${btnId}"]`
            );

          this.showSizes(sizesContent);
        });

        this.duplicatedSizesContent.addEventListener('click', e => {
          const isSizesContent = e.target.classList.contains(
            'js-sizes-content'
          );

          if (!isSizesContent) {
            return;
          }

          const sizesContent = e.target;

          this.hideSizes(sizesContent);
        });

        this.duplicatedSizesContent.addEventListener('keydown', e => {
          const isEscape = e.key === 'Escape';

          if (!isEscape) {
            return;
          }

          this.hideSizes(this.duplicatedSizesContent);
        });

        this.duplicatedSizesContent.addEventListener('keydown', e => {
          const isTabKey = e.key === 'Tab';

          if (!isTabKey) {
            return;
          }

          const isFirstElementFocused =
            document.activeElement === this.firstFocusableElement;
          const isLastElementFocused =
            document.activeElement === this.lastFocusableElement;

          if (e.shiftKey && isFirstElementFocused) {
            this.lastFocusableElement.focus();

            e.preventDefault();
          } else if (!e.shiftKey && isLastElementFocused) {
            this.firstFocusableElement.focus();

            e.preventDefault();
          }
        });

        window.addEventListener('resize', () => {
          const isSizeContentVisible =
            this.duplicatedSizesContent.classList.contains(
              'is-visible'
            );
          const hasHover = matchMedia('(hover: hover)').matches;

          if (DeviceDetector.isMobile() || !isSizeContentVisible || !hasHover) {
            return;
          }

          this.hideSizes(this.duplicatedSizesContent);
        });

        this.sizesContent.addEventListener(
          'click',
          this.handleBtnSizeClick.bind(this)
        );
        this.duplicatedSizesContent.addEventListener(
          'click',
          this.handleBtnSizeClick.bind(this)
        );
      }

      if (this.swatches) {
        this.btnSwatches =
          this.swatches.querySelectorAll('.js-btn-swatch');

        this.swatches.addEventListener('change', e => {
          this.querySelector('a.card-product__media').classList.add('is-transitioning');

          const isBtnSwatch =
            e.target.classList.contains('js-btn-swatch');

          if (!isBtnSwatch) {
            return;
          }

          const btnSwatch = e.target;
          const isSwatchActive =
            btnSwatch.classList.contains('is-active');

          if (isSwatchActive) {
            return;
          }

          const btnSwatchColor = btnSwatch.dataset.color;
          const btnSwatchColorHandle = btnSwatch.dataset.colorHandle;
          const btnSwatchColorHyphenated = btnSwatchColorHandle.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/-$/, '')
            .replace(/^-/, '');

          const activeBtnSwatch = this.swatches.querySelector(
            '.js-btn-swatch.is-active'
          );

          const currentVisibleMedia = this.querySelector(
            '[class*="js-media"].is-visible'
          );
          const newVisibleMedia = this.querySelector(
            `.js-media-${btnSwatchColorHyphenated}`
          );

          activeBtnSwatch?.classList.remove('is-active');
          btnSwatch?.classList.add('is-active');

          if (newVisibleMedia) {
            currentVisibleMedia.classList.remove('is-visible');
            newVisibleMedia.classList.add('is-visible');
          } else if (this.defaultMedia) {
            currentVisibleMedia.classList.remove('is-visible');
            this.defaultMedia.classList.add('is-visible');
          }

          if (!this.btnToggleSizes) {
            return;
          }

          const sizeMessagesContainer =
            this.sizesContent.querySelector(
              '.js-messages.is-visible'
            );

          sizeMessagesContainer?.classList.remove('is-visible');

          const isRequesting =
            this.classList.contains('is-requesting');

          if (isRequesting) {
            return;
          }

          this.toggleBtns();

          this.querySelector('a.card-product__media').classList.remove('is-transitioning');

          const updateAvailableSizes = async () => {
            try {
              const product = await this.getProduct();

               const matchingColorVariants = product.variants.filter(
                 variant =>
                   variant.options.some(option => option == btnSwatchColor)
               );

              this.sizeBtns.forEach(sizeBtn => {
                const size = sizeBtn.dataset.size;

                let matchingSizeVariant;
                const shouldAutoSelectVariant = sizeBtn.classList.contains('js-first-available-variant');
                if (shouldAutoSelectVariant) {
                  const firstMatchingColorVariant = matchingColorVariants.find(
                    variant => variant.available
                  );

                  if (firstMatchingColorVariant) {
                    matchingSizeVariant = firstMatchingColorVariant;
                  }
                } else if (matchingColorVariants.length == 1) {
                  matchingSizeVariant = matchingColorVariants.find(
                    matchingColorVariant =>
                      product.variants.some(
                        variant =>
                          variant.options.includes(size) &&
                          variant.color === matchingColorVariant.color
                      )
                  );
                } else {
                  matchingSizeVariant = matchingColorVariants.find(
                    matchingColorVariant =>
                      matchingColorVariant.options.includes(size)
                  );
                }

                if (
                  matchingSizeVariant &&
                  matchingSizeVariant.available
                ) {
                  sizeBtn.setAttribute('aria-disabled', false);
                  sizeBtn.classList.remove('is-disabled');
                  if (matchingColorVariants.length == 1 || shouldAutoSelectVariant) {
                    sizeBtn.setAttribute(
                      'data-variantid',
                      matchingSizeVariant.id
                    );
                    sizeBtn.setAttribute(
                      'data-size',
                      matchingSizeVariant.options[0]
                    );
                    sizeBtn.setAttribute(
                      'title',
                      matchingSizeVariant.title
                    );
                  }
                  return;
                }

                sizeBtn.setAttribute('aria-disabled', true);
                sizeBtn.classList.add('is-disabled');
              });
            } catch (error) {
              console.error(error);
            } finally {
              this.toggleBtns();
            }
          };

          updateAvailableSizes();
        });
      }
    }

    async getProduct() {
      try {
        const productResponse = await fetch(
          `${window.Shopify.routes.root}products/${this.dataset.handle}.js`
        );

        const product = await productResponse.json();

        return product;
      } catch (error) {
        console.error(error);
      }
    }

    duplicateSizes() {
      this.sizesContent = this.querySelector('.js-sizes-content');
      this.duplicatedSizesContent = this.sizesContent.cloneNode({
        deep: true
      });
      this.duplicatedSizesContainer = document.querySelector(
        '.js-card-sizes-duplicate'
      );

      this.focusableElements = getFocusableElements(
        this.duplicatedSizesContent
      );

      this.firstFocusableElement = this.focusableElements[0];
      this.lastFocusableElement =
        this.focusableElements[this.focusableElements.length - 1];

      if (!this.duplicatedSizesContainer) {
        this.duplicatedSizesContainer = document.createElement('div');
        this.duplicatedSizesContainer.classList.add(
          'js-card-sizes-duplicate'
        );

        document.body.insertAdjacentElement(
          'beforeend',
          this.duplicatedSizesContainer
        );
      }

      this.duplicatedSizesContainer.insertAdjacentElement(
        'beforeend',
        this.duplicatedSizesContent
      );
    }

    handleBtnSizeClick(e) {
      const isBtnSize = e.target.classList.contains('js-btn-size');

      if (!isBtnSize) {
        return;
      }

      const btnSize = e.target;
      const isDisabled = btnSize.classList.contains('is-disabled');
      const isRequesting = this.classList.contains('is-requesting');

      if (isRequesting || isDisabled) {
        return;
      }

      const btnSwatchActive = this.querySelector(
        '.js-btn-swatch.is-active'
      );

      const selectedSize = btnSize.dataset.size;
      const selectedColor = btnSwatchActive?.dataset.color;

      const selectedVariantId = btnSize.dataset.variantid
        ? btnSize.dataset.variantid
        : undefined;

      const targetSizesContent = btnSize.closest('.js-sizes-content');
      const sizeMessagesContainer =
        targetSizesContent.querySelector('.js-messages');
      const sizeMessageSuccess = targetSizesContent.querySelector(
        '.js-success-message'
      );
      const sizeMessageError = targetSizesContent.querySelector(
        '.js-error-message'
      );

      this.toggleBtns();

      const addProductToCart = async () => {
        try {
          const product = await this.getProduct();

          const matchingVariant = product.variants.find(variant => {
            if (selectedVariantId) {
              const matchesVariantId =
                variant.id == selectedVariantId;
              return matchesVariantId;
            } else {
              const matchesSize =
                variant.options.includes(selectedSize);
              const matchesColor = btnSwatchActive
                ? variant.options.includes(selectedColor)
                : true;
              return matchesSize && matchesColor;
            }
          });

          if (!matchingVariant) {
            return;
          }

          const isAvailable = matchingVariant.available;

          if (!isAvailable) {
            return;
          }

          const formData = new FormData();
          formData.append('id', matchingVariant.id);
          formData.append('quantity', 1);
          if (this.hasAttribute('data-has-pre-order')) {
            formData.append('properties[Pre-order]', '✓');
          }
          formData.append(
            'sections',
            this.cartDrawer
              .getSectionsToRender()
              ?.map(section => section.section)
          );

          // if we are on the cart page, resubmit form
          if (window.location.pathname === '/cart') {
            const cartDrawerForm = document.getElementById(
              'CartDrawer-FormSummary'
            );
            if (cartDrawerForm) {
              cartDrawerForm.submit();
            }
          }

          let sectionsToRender = [];
          if (this.cartDrawer && typeof this.cartDrawer.getSectionsToRender === 'function') {
            sectionsToRender = this.cartDrawer.getSectionsToRender()?.map(s => s.section) || [];
          } else {
            const mainCartItems = document.getElementById('main-cart-items');
            if (mainCartItems && mainCartItems.dataset && mainCartItems.dataset.id) {
              sectionsToRender.push(mainCartItems.dataset.id);
            }
            sectionsToRender.push('cart-counter');
          }

          formData.append('sections', sectionsToRender);
          formData.append('sections_url', window.location.pathname);

          const config = fetchConfig('javascript');
          config.headers['X-Requested-With'] = 'XMLHttpRequest';
          delete config.headers['Content-Type'];
          config.body = formData;

          const addToCartResponse = await fetch(
            `${routes.cart_add_url}`,
            config
          );

          const addToCartData = await addToCartResponse.json();

          if (!addToCartResponse.ok) {
            throw new Error(addToCartData.description);
          }

          sizeMessageSuccess.classList.remove('hidden');
          sizeMessageError.classList.add('hidden');

          if (this.cartDrawer && typeof this.cartDrawer.renderContents === 'function') {
            this.cartDrawer.renderContents(addToCartData, true);
          }
          if (window.location.pathname === '/cart' || !this.cartDrawer) {
            try {
              const sections = sectionsToRender;
              sections.forEach(sectionId => {
                const sectionHtml = addToCartData.sections?.[sectionId];
                if (!sectionHtml) return;
                const selector = `#shopify-section-${sectionId} cart-items`;
                const containerBySelector = document.querySelector(selector);
                const containerById = document.querySelector(`#shopify-section-${sectionId}`);

                if (containerBySelector) {
                  containerBySelector.innerHTML = new DOMParser()
                    .parseFromString(sectionHtml, 'text/html')
                    .querySelector(selector).innerHTML;
                } else if (containerById) {
                  containerById.innerHTML = new DOMParser()
                    .parseFromString(sectionHtml, 'text/html')
                    .querySelector(`#shopify-section-${sectionId}`).innerHTML;
                } else {
                  const possible = document.querySelector(`[data-id="${sectionId}"]`);
                  if (possible) {
                    const parsed = new DOMParser().parseFromString(sectionHtml, 'text/html');
                    const extracted = parsed.querySelector(`[data-id="${sectionId}"]`);
                    if (extracted)
                      possible.innerHTML = extracted.innerHTML;
                  }
                }
              });

              document.dispatchEvent(
                new CustomEvent('cart:updated', {
                  detail: addToCartData
                })
              );
            } catch (replaceError) {
              console.error(replaceError);
            }
          }
        } catch (error) {
          const errorTextEl =
            sizeMessageError.querySelector('[data-text]');

          sizeMessageSuccess.classList.add('hidden');
          sizeMessageError.classList.remove('hidden');

          errorTextEl.textContent = error.message;
        } finally {
          this.toggleBtns();

          sizeMessagesContainer.classList.add('is-visible');
          setTimeout(() => {
            sizeMessagesContainer.classList.remove('is-visible');
          }, 4000);

          // Remove is-visible class on mobile after adding product to cart
          if (DeviceDetector.isMobile()) {
            this.duplicatedSizesContent.classList.remove('is-visible');
            if (this.cartDrawer?.classList.contains('is-visible')) {
              return;
            }
            document.body.classList.remove('overflow-hidden');
          }
        }
      };

      addProductToCart();
    }

    setAccessibility() {
      const duplicatedSizesContentId = `SizesPopup-${this.sizesContent.dataset.id}`;

      this.duplicatedSizesContent.id = duplicatedSizesContentId;
      this.btnToggleSizes.setAttribute('aria-expanded', false);
      this.btnToggleSizes.setAttribute(
        'aria-controls',
        duplicatedSizesContentId
      );
    }

    toggleBtns() {
      this.classList.toggle('is-requesting');
      this.btnSwatches?.forEach(btnSwatch =>
        btnSwatch.toggleAttribute('disabled')
      );

      if (!this.btnToggleSizes) {
        return;
      }

      this.sizesContent.classList.toggle('overlay-visible');
      this.duplicatedSizesContent.classList.toggle('overlay-visible');
    }

    showSizes(container) {
      this.btnToggleSizes.setAttribute('aria-expanded', true);
      container.classList.add('is-visible');
      document.body.classList.add('overflow-hidden');
      this.firstFocusableElement.focus();
    }

    hideSizes(container) {
      this.btnToggleSizes.setAttribute('aria-expanded', false);
      container.classList.remove('is-visible');
      document.body.classList.remove('overflow-hidden');
      this.btnToggleSizes.focus();
    }
  }

  customElements.define('card-product', CardProduct);
}
