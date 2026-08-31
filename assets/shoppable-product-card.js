if (!customElements.get('shoppable-product-card-thumb')) {
  class ShoppableProductCardThumb extends HTMLElement {
    constructor() {
      super();
      if (Shopify.designMode) {
        window.addEventListener('shopify:section:load', this.init.bind(this));
      }
      this.init();
    }

    init() {
      this.parentDiv = this.closest('section');
      const listDiv = this.parentDiv?.querySelector('.shoppable-section__list');
      this.isListLayout = !!listDiv;
      this.toggleState = false;
      this.productHolderElement = this.getProductHolderElement();
      this.productHolderDrawer = this.closest('shoppable-drawer')?.querySelector('.shoppable-drawer__product--holder');
      this.blockProductId = this.getAttribute('data-card-id');
      this.productHandle = this.getAttribute('data-product');
      this.querySelector('.button__shoppable-product-card').addEventListener(
        'click',
        this.toggle.bind(this)
      )
    }

    toggle(event) {
      this.reset();
      if (!this.toggleState) {
        this.open(event);
      } else {
        this.close();
      }
    }

    open(event) {
      this.showProduct();
      this.toggleState = true;
      this.classList.add('is--active');
      this.parentElement.classList.add('is--active');
      if (this.productHandle !== 'placeholder')
        document.getElementById(`shoppable__dot-${this.blockProductId}`)?.classList.add('is--active');
      this.toggleAriaExpanded(event);

      const target = event.target;
      const shoppableBlock = target.closest('.shoppable-block');
      const shoppableSectionList = target.closest(
        '.shoppable-section__list'
      );

      if (shoppableBlock && shoppableSectionList) {
        const productCard = shoppableBlock.querySelector(
          'shoppable-product-card'
        );
        if (productCard) {
          const productCardHeight = productCard.offsetHeight;
          if (window.innerWidth > 989 && this.isListLayout) {
            shoppableBlock.style.boxSizing = 'content-box';
          }
          shoppableBlock.style.minHeight = productCardHeight + 'px';
        }
      }
    }

    close(event) {
      this.hideProduct();
      this.toggleState = false;
      this.classList.remove('is--active');
      this.parentElement.classList.remove('is--active');
      if (this.productHandle !== 'placeholder')
        document.getElementById(`shoppable__dot-${this.blockProductId}`)?.classList.remove('is--active');
      this.toggleAriaExpanded();

      const target = event?.target || this;
      const shoppableBlock = target.closest('.shoppable-block');
      const shoppableSectionList = target.closest(
        '.shoppable-section__list'
      );
      if (shoppableBlock && shoppableSectionList) {
        shoppableBlock.style.minHeight = '';
      }

      if (window.innerWidth >= 989) {
        requestAnimationFrame(() => {
          const shoppableBlock = this.closest('.shoppable-block');
          if (shoppableBlock) {
            shoppableBlock.removeAttribute('style');
          }
        });
      }
    }

    toggleAriaExpanded(event) {
      if (event) {
        event.target.closest('button').setAttribute('aria-expanded', true);
        document.querySelectorAll('.button__shoppable-product-card--back').forEach((button) => {
          button.setAttribute('aria-expanded', true);
        });
      } else {
        document.querySelectorAll('[aria-controls="shoppable-product-card-thumb"]').forEach((button) => {
          button.setAttribute('aria-expanded', false);
        });
      }
    }

    reset() {
      this.closest('.shoppable-block')?.querySelectorAll('shoppable-product-card-thumb').forEach(el => {
        if (this.blockProductId !== el.getAttribute('data-card-id')) {
          el.close();
        }
      });
    }

    showProduct() {
      this.productCard = this.closest('.shopify-section').querySelector('.shoppable__product-card--holder').querySelector(
        `[data-product-handle='${this.productHandle}']`
      ).cloneNode(true);

      this.productCard.setAttribute('data-card-id', this.blockProductId);
      this.productCard.querySelector('button.button__shoppable-product-card--back').addEventListener('click', this.close.bind(this));
      if (window.innerWidth > 990) {
        this.productHolderElement?.appendChild(this.productCard);
      } else {
        if (this.isListLayout) {
          this.productHolderDrawer = this.closest(`#${this.parentDiv.id}`).querySelector('.shoppable-drawer__product--holder');
          this.productHolderDrawer.innerHTML = '';
          this.productHolderDrawer.appendChild(this.productCard);
          this.closest(`#${this.parentDiv.id}`).querySelector('shoppable-drawer').openProduct();
        } else {
          this.productHolderDrawer.innerHTML = '';
          this.productHolderDrawer.appendChild(this.productCard);
          this.closest('shoppable-drawer').openProduct();
        }
      }

      this.closest('.shopify-section').addEventListener('slideChanged', () => {
        this.close();
      })

      requestAnimationFrame(() => {
        if (window.innerWidth > 989 && this.isListLayout) {
          const productSelector = this.productCard.querySelector('.product-selector__variant-picker');
          if (productSelector && productSelector.offsetHeight > 0) {
            const shoppableBlock = productSelector.closest('.shoppable-block');
            if (shoppableBlock) {
              shoppableBlock.style.setProperty('--shoppable-block-padding-block', '0');
              if(!this.isListLayout) {
                shoppableBlock.style.paddingBlock = '96px 150px';
              }
            }
          }
        }
      });
    }

    hideProduct() {
      if (window.innerWidth > 990) {
        this.productHolderElement.innerHTML = '';
      } else if (this.isListLayout) {
        this.closest(`#${this.parentDiv.id}`).querySelector('shoppable-drawer').closeProduct();
      } else {
        this.closest('shoppable-drawer').closeProduct();
      }
    }

    getProductHolderElement() {
      if (this.closest('.shoppable-block__products'))
       return this.closest('.shoppable-block__products').querySelector('.shoppable-block__product--holder');
    }

  }

  customElements.define('shoppable-product-card-thumb', ShoppableProductCardThumb );
}

/**
 * Shoppable Product Card Extended - Variants & Cart Form
 */
if (!customElements.get('shoppable-product-card')) {
  class ShoppableProductCard extends HTMLElement {
    constructor() {
      super();
      if (Shopify.designMode) {
        window.addEventListener('shopify:section:load', this.init.bind(this));
      }
      this.init();
    }

    init() {
      if (this.closest('.shoppable__product-card--holder')) { return; }
      // variants
      if (this.querySelector('.product-selector')) this.initVariantSelector();
      // form
      this.querySelector('form').addEventListener(
        'submit',
        this.submitForm.bind(this)
      )
    }

    /**
     * Set variants changes
     */
    initVariantSelector() {
      if (this.querySelector('[type="application/json"]')) {
        this.variants = JSON.parse(this.querySelector('[type="application/json"]').textContent);
      }

      const productSelector = this.querySelector('.product-selector');
      const boundVariantChange = this.onVariantChange.bind(this);

      productSelector.addEventListener('change', boundVariantChange);

      this.updateOptions();
      this.currentVariant = this.getVariantData();
      this.updateVariantStatuses();
      this.updateVariant();
    }

    onVariantChange() {
      this.updateOptions();
      const newVariant = this.getVariantData();
      if (!newVariant) return;
      this.updateVariant();
      this.updateVariantStatuses();
      this.updateVariantImage();
    }

    updateOptions() {
      this.querySelectorAll('.product-options__item').forEach(item => {
        item.classList.remove('is-active');
      });

      this.querySelectorAll('input[type="radio"]:checked').forEach(input => {
        const item = input.closest('.product-options__item');
        if (item) item.classList.add('is-active');
      });

      this.options = Array.from(
        this.querySelectorAll('input[type="radio"]:checked'),
        el => ({ name: el.dataset.name || el.name, value: el.value })
      );
    }

    updateVariant() {
      this.currentVariant = this.getVariantData();
      this.querySelector('[name="id"]').value = this.currentVariant.id;
      if (this.currentVariant.available) {
        this.querySelector('button[type="submit"]').disabled = false;
      } else {
        this.querySelector('button[type="submit"]').disabled = true;
      }
    }

    updateVariantImage() {
      const productHandle = this.closest('shoppable-product-card')?.getAttribute('data-product-handle');
      if (!productHandle || !this.currentVariant) return;

      if (!this.productDataPromise) {
        this.productDataPromise = fetch(`/products/${productHandle}.js`).then(res => res.json());
      }

      this.productDataPromise
        .then(productData => {
          const variantData = productData.variants.find(v => v.id === this.currentVariant.id);
          const imageWrapper = this.querySelector('.shoppable-product-card__image-wrapper');
          const allImages = imageWrapper.querySelectorAll('[data-product-images], img');

          allImages.forEach(img => img.classList.add('hidden'));

          if (variantData && variantData.featured_image) {
            const variantImageUrl = variantData.featured_image.src;
            const matchedImg = Array.from(allImages).find(el =>
              el.querySelector('img')?.src.includes(variantImageUrl) ||
              el.src?.includes(variantImageUrl)
            );

            if (matchedImg) {
              matchedImg.classList.remove('hidden');
            } else {
              const existingDynamic = imageWrapper.querySelector('.dynamic-variant-image');
              if (existingDynamic) existingDynamic.remove();

              const newImg = document.createElement('img');
              newImg.classList.add('dynamic-variant-image');
              newImg.src = variantImageUrl;
              newImg.alt = variantData.featured_image.alt || '';
              imageWrapper.appendChild(newImg);
            }
          } else {
            const firstImage = imageWrapper.querySelector('[data-product-images]') || imageWrapper.querySelector('img');
            if (firstImage) firstImage.classList.remove('hidden');
          }
        })
        .catch(err => console.error('Variant image fetch error:', err));
    }

    getVariantData() {
      return this.options.length
        ? this.variants.find(variant => !variant.options.map((option, index) => this.options[index] && this.options[index].value === option).includes(false))
        : this.variants[0];
    }

    updateVariantStatuses() {
      const optionOneValue = this.querySelector('.product-selector fieldset').querySelector(':checked').value;
      const selectedOptionOneVariants = this.variants.filter(variant => optionOneValue === variant.option1);
      const inputWrappers = [...this.querySelectorAll('.product-selector fieldset')];
      inputWrappers.forEach((option, index) => {
        if (index === 0) return;
        const previousOptionSelected =
          inputWrappers[index - 1].querySelector(':checked').value;
        const listOfAvailableOptions = selectedOptionOneVariants
          .filter(
            variant =>
              variant.available &&
              variant[`option${index}`] === previousOptionSelected
          )
          .map(variantOption => variantOption[`option${index + 1}`]);
        option.querySelectorAll('input[type="radio"]').forEach(input => {
          const inputIsDisabled = !listOfAvailableOptions.includes(input.value);
          input.disabled = inputIsDisabled;
        });
      });
    }

    /**
     * Submit add to cart form
     */
    submitForm(event) {
      event.preventDefault();
      this.submitButton = this.querySelector('button[type="submit"]')

      const formData = new FormData(event.target);
      if (this.hasAttribute('data-has-pre-order')) {
        formData.append('properties[Pre-order]', '✓');
      }
      formData.delete('options[Size]');
      for (let [key, value] of formData) {
        if (key.includes('options')) formData.delete(key);
      }
      formData.append(
        'sections',
        document.querySelector('cart-drawer')
          .getSectionsToRender()
          .map(section => section.section)
      );

      const config = fetchConfig('javascript');
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];
      config.body = formData;

      this.submitButton.classList.add('disabled');

      fetch(`${routes.cart_add_url}`, config)
        .then(response => response.json())
        .then(response => {
          if (response.status) {
            this.handleErrorMessage(response.description);
            return;
          }

        document.querySelector('cart-drawer').renderContents(response);
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
      errorWrapper.classList.toggle('hidden', !errorMessage);
      errorWrapper.textContent = errorMessage || '';
      setTimeout(() => {
        errorWrapper.textContent = '';
        errorWrapper.classList.toggle('hidden');
      }, 5000);
    }
  }

  customElements.define('shoppable-product-card', ShoppableProductCard );
}
