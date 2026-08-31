if (!customElements.get('product-selector')) {
class ProductSelector extends HTMLElement {
  constructor() {
    super();
    this.inputWrapper = '[data-input-wrapper]';
    this.variants = JSON.parse(this.querySelector('[type="application/json"]').textContent);

    const isModalContext = this.dataset.context === 'modal';

    if (isModalContext) {
      const modal = this.closest('quick-cart-modal') || this.closest('.quick-cart-product-modal');
      this.form = modal?.querySelector('form.product__form');
    } else {
      this.form = document.querySelector(
        `#ProductForm-${this.dataset.sectionId}`
      );
    }

    if (!isModalContext) {
      this.purchaseOptions = document.querySelector(
        `#Product-Purchase-Options-${this.dataset.sectionId}`
      );
      this.productBar = document.querySelector(
        `#ProductBar-${this.dataset.sectionId}`
      );

      if (this.dataset.installmentsFormId && this.dataset.installmentsFormId !== '#') {
        this.installmentsForm = document.querySelector(
          this.dataset.installmentsFormId
        );
      }
    } else {
      this.purchaseOptions = null;
      this.productBar = null;
      this.installmentsForm = null;
    }

    this.addEventListener('change', this.onVariantChange.bind(this));

    this.updateOptions();
    // this.updateVariantStatuses();
    this.updateVariant();
    this.initUpdateMedia();

    if (this.currentVariant && !isModalContext) {
      if (this.form && this.form.toggleAddButton) {
        this.form.toggleAddButton(!this.currentVariant.available, '');
      }
    }

    if (isModalContext && this.form) {
      const submitButton = this.form.querySelector('button[type="submit"]');
      if (submitButton && this.currentVariant) {
        submitButton.disabled = !this.currentVariant.available;
      }
    }
    this.createDropdownFromButtons();

    this.enableDropdownStyle();
  }

  updateVariantStatuses() {
    const inputWrappers = [
      ...this.querySelectorAll(this.inputWrapper)
    ];

    inputWrappers.forEach((optionWrapper, optionIndex) => {
      // get selected values from other options
      const selectedValues = inputWrappers.map((wrapper, idx) => {
        if (idx === optionIndex) return null; // Bu option serbest
        const checked = wrapper.querySelector(':checked');
        return checked ? checked.value : null;
      });

      // get possible values for this option
      const possibleValues = this.variants
        .filter(variant => {
          return selectedValues.every((val, idx) => {
            if (val === null) return true;
            return variant[`option${idx + 1}`] === val;
          }) && variant.available;
        })
        .map(variant => variant[`option${optionIndex + 1}`]);

      const optionInputs = [
        ...optionWrapper.querySelectorAll('input[type="radio"], option')
      ];

      optionInputs.forEach(input => {
        const value = input.getAttribute('value');
        const isAvailable = possibleValues.includes(value);
        if (input.getAttribute('data-stock')) {
          return;
        } else {
          input.disabled = !isAvailable;
        }
        if (input.tagName.toLowerCase() === 'option') {
          const escapedValue = input.value.replace(/"/g, '\"');
          const selector = `button[data-value="${escapedValue}"]`;
          const button = input.closest('dropdown-input').querySelector(selector);
          if (button) {
            button.disabled = !isAvailable;
          }
        }
        if (!this.productBar) return;
        const inputId = input.dataset.id || input.id;
        const productBarInput = this.productBar.querySelector(
          `option[data-id="${inputId}"]`
        );
        if (!productBarInput) return;
        productBarInput.disabled = !isAvailable;
      });
    });
  }

  onVariantChange(event) {
    const isModalContext = this.dataset.context === 'modal';

    if (!isModalContext) {
      const selectedOptionValues = Array.from(this.querySelectorAll('input[type="radio"]:checked')).map(({ dataset }) => dataset.optionValue);

      const params =
        selectedOptionValues.length > 0
          ? `&option_values=${selectedOptionValues.join(',')}`
          : '';
      fetch(`${window.location.pathname}?${params}`)
        .then(response => response.text())
        .then(responseText => {
          const html = new DOMParser().parseFromString(responseText,'text/html');
          const newSelector = html.querySelector('product-selector');
          if (newSelector) {
            this.replaceWith(newSelector);
          }
        });
    }

    if (event.target.type === 'number') return;
    this.updateOptions();
    if (this.currentVariant === this.getVariantData()) return;

    this.updateVariant();
    // this.updateVariantStatuses();

    if (!isModalContext) {
      this.productBarUpdateOptions();
      this.updatePickupAvailability();
    }

    if (this.form) {
      // this.form.removeAttribute('data-has-selling-plan'); // removing this is causing issue for selling plans
      if (this.form.toggleAddButton) {
        this.form.toggleAddButton(false, '');
      }
      if (this.form.handleErrorMessage) {
        this.form.handleErrorMessage();
      }
    }

    if (!this.currentVariant) {
      if (this.form && this.form.toggleAddButton) {
        this.form.toggleAddButton(true, '');
      }
      if (!isModalContext) this.setUnavailable();

      return;
    }

    if (!this.currentVariant.available) {
      if (this.form) {
        if (isModalContext) {
          const submitButton = this.form.querySelector('button[type="submit"]');
          if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = window.theme?.strings?.soldOut;
          }
        } else if (this.form.toggleAddButton) {
          this.form.toggleAddButton(true, window.theme.strings.soldOut);
        }
      }
    } else {
      if (isModalContext && this.form) {
        const submitButton = this.form.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.disabled = false;
          const preorderText = this.form.closest('[data-has-pre-order]')
            ? (window.theme?.strings?.preorderText)
            : (window.theme?.strings?.addToCart);
          submitButton.querySelector('span').textContent = preorderText;
        }
      }
    }

    this.updateMedia();
    if (!isModalContext) {
      this.updateURL();
      this.renderProductInfo();
    }
    this.updateVariantInput();
  }

  updateOptions() {
    this.querySelectorAll('input[type="radio"]').forEach(input => {
      input.closest('.product-options__item')?.classList.toggle('is-active', input.checked);
    });
    this.options = Array.from(
      this.querySelectorAll('input[type="radio"]:checked, select'),
      el => ({ name: el.dataset.name || el.name, value: el.value })
    );
  }

  productBarUpdateOptions() {
    if (this.productBar) {
      Array.from(this.productBar.querySelectorAll('select')).map(
        selector => {
          selector.value = this.options.find(
            option => option.name === selector.name
          ).value;
        }
      );
      this.productBar.querySelectorAll('dropdown-input').forEach(
        dropdown => {
          dropdown.update();
        }
      );
    }
  }

  updateInventoryNotice(html) {
    const destination = document.querySelector('[data-inventory-notice]');
    const source = html.querySelector('[data-inventory-notice]');

    if (source && destination) destination.innerHTML = source.innerHTML;

    const maxQuantityInput = html.querySelector('product-form quantity-input input.quantity__input');
    const maxQuantity = maxQuantityInput ? parseInt(maxQuantityInput.max) : 0;

    // Pass the inventory quantity from source to the quantity input
    const inventoryQuantityMatch = source?.textContent.match(/\d+/);
    const inventoryQuantity = inventoryQuantityMatch
      ? parseInt(inventoryQuantityMatch[0])
      : maxQuantity || 0;

    this.updateQuantityInput(inventoryQuantity);
  }

  updateQuantityInput(inventoryQuantity) {
    const selectedVariantData = this.getVariantData();
    const quantityInput = document.querySelector('.product-selector__quantity quantity-input input');

    let productUsesInventory = true;

    // check inventory is active
    if (selectedVariantData && selectedVariantData.inventory_management === null) {
      productUsesInventory = false;
    }

    // check sell on sold out is active
    if (selectedVariantData && selectedVariantData.inventory_quantity !== null && inventoryQuantity === 0 && selectedVariantData.available === true) {
      productUsesInventory = false;
    }

    if (quantityInput) {
      if (productUsesInventory) {
        quantityInput.setAttribute('max', inventoryQuantity);
        // set value accordingly to inventory
        if (quantityInput.value > inventoryQuantity) {
          quantityInput.value = inventoryQuantity;
        }

        else if (Number(quantityInput.value) == 0 && inventoryQuantity > 0) {
          quantityInput.value = 1;
        }

      } else {
        quantityInput.setAttribute('max', '');
      }
    }
  }

  updatePickupAvailability() {
    const pickUpAvailabilityNode = document.querySelector(
      'pickup-availability'
    );

    if (!pickUpAvailabilityNode || !this.currentVariant) return;

    pickUpAvailabilityNode.dataset.variantId = this.currentVariant.id;

    if (this.currentVariant && this.currentVariant.available) {
      pickUpAvailabilityNode.setAttribute('available', '');
      pickUpAvailabilityNode.fetchAvailability(
        pickUpAvailabilityNode.dataset.variantId
      );

      return;
    }

    pickUpAvailabilityNode.removeAttribute('available');
    pickUpAvailabilityNode.innerHTML = '';
  }

  updateVariant() {
    this.currentVariant = this.getVariantData();
  }

  getVariantData() {
    if (this.options?.length === 0) {
      return this.variants[0]; // Return the first variant if no options are selected
    }

    return this.variants.find(variant => {
      // Check if the variant's options match the selected options
      return this.options?.every(option => {
        const optionIndex = this.options.findIndex(opt => opt.name === option.name) + 1;
        return variant[`option${optionIndex}`] === option.value;
      });
    });
  }

  initUpdateMedia() {

    const urlParams = new URLSearchParams(window.location.search);
    const variantIdFromUrl = parseInt(urlParams.get('variant'));

    if (variantIdFromUrl) {
      this.currentVariant = this.variants.find(variant => variant.id === variantIdFromUrl);

      if (this.currentVariant) {
        this.updateMedia();
      }
    }
  }

  updateMedia() {
    if (!this.currentVariant || !this.currentVariant.featured_media)
      return;

    const isModalContext = this.dataset.context === 'modal';
    const productMedia = isModalContext
      ? this.closest('.quick-cart-product-modal')?.querySelector('product-media')
      : document.querySelector('product-media');

    if (productMedia && productMedia.setActiveMedia) {
      productMedia.setActiveMedia(
        this.currentVariant.featured_media.id
      );
    } else if (isModalContext) {
      const modal = this.closest('quick-cart-modal');
      if (modal && modal.setActiveMedia) {
        modal.setActiveMedia(this.currentVariant.featured_media.id);
      }
    }
  }

  updateURL(sellingPlanId) {
    if (!this.currentVariant) return;
    const params = new URLSearchParams(window.location.search);
    params[params.has('variant') ? 'set' : 'append'](
      'variant',
      this.currentVariant.id
    );
    if (sellingPlanId) {
      params[params.has('selling_plan') ? 'set' : 'append'](
        'selling_plan',
        sellingPlanId
      );
    } else {
      params.delete('selling_plan');
    }
    window.history.replaceState(
      {},
      '',
      `${this.dataset.url}?${params.toString()}`
    );
  }

  updateVariantInput() {
    const isModalContext = this.dataset.context === 'modal';
    const inputs = [
      this.querySelector('[name="id"]'),
      this.installmentsForm?.querySelector('[name="id"]')
    ];

    if (isModalContext && this.form) {
      const formHiddenInput = this.form.querySelector('input[name="id"]');
      if (formHiddenInput) {
        inputs.push(formHiddenInput);
      }
    }

    inputs.forEach(input => {
      if (!input) return;
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  setUnavailable() {
    const submitButton = this.form.submitButton;
    const price = this.querySelector(
      `#Product-Price-${this.dataset.sectionId}`
    );

    if (!submitButton) return;
    submitButton.textContent = window.theme.strings.unavailable;
    if (price) price.classList.add('visibility-hidden');
  }

  createDropdownFromButtons() {
    const inputWrappers = this.querySelectorAll(this.inputWrapper);

    inputWrappers.forEach((wrapper) => {
      const radios = wrapper.querySelectorAll('input[type="radio"]');
      const selectWrapper = wrapper.querySelector('[data-select-wrapper]');
      const select = wrapper.querySelector('[data-select]');

      if (!radios.length || !selectWrapper || !select) return;

      select.innerHTML = '';
      radios.forEach((radio) => {
        const option = document.createElement('option');
        option.value = radio.value;
        option.textContent = radio.value;
        if (radio.checked) option.selected = true;
        if (radio.disabled) option.disabled = true;
        select.appendChild(option);
      });

      select.addEventListener('change', (e) => {
        const selectedValue = e.target.value;

        // First uncheck all radios in this group
        radios.forEach(radio => {
          radio.checked = false;
          radio.closest('.product-options__item')?.classList.remove('is-active');
        });

        // Then check the selected one
        const targetRadio = Array.from(radios).find(r => r.value === selectedValue);
        if (targetRadio) {
          targetRadio.checked = true;
          targetRadio.closest('.product-options__item')?.classList.add('is-active');

          // Update the options state on the parent element
          this.updateOptions();

          // Dispatch the change event to trigger the variant change
          targetRadio.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      selectWrapper.classList.remove('hidden');
    });
  }

  renderProductInfo() {
    const params = new URLSearchParams(window.location.search);
    params[params.has('variant') ? 'set' : 'append'](
      'variant',
      this.currentVariant.id
    );
    params.append('section_id', this.dataset.sectionId);

    fetch(`${this.dataset.url}?${params.toString()}`)
      .then(response => response.text())
      .then(responseText => {
        const html = new DOMParser().parseFromString(
          responseText,
          'text/html'
        );
        [
          `#Product-Price-${this.dataset.sectionId}`,
          `#Product-Purchase-Options-${this.dataset.sectionId}`
        ].map(liveRegionSelector => {
          const destination = document.querySelector(
            liveRegionSelector
          );
          const source = html.querySelector(liveRegionSelector);

          this.updateInventoryNotice(html);

          if (destination && source) {
            destination.classList.remove('visibility-hidden');
            destination.innerHTML = source.innerHTML;
          }
        });
      });
  }

  enableDropdownStyle() {
    const wrappers = Array.from(this.querySelectorAll('.js-product-options-value-list'));

    const closeDropdown = w => {
      w.dataset.open = 'false';
      const ul = w.querySelector('ul');
      if (ul) {
        ul.querySelectorAll('li[data-cloned]').forEach(c => c.remove());
        ul.querySelectorAll('li').forEach(li => li.style.display = '');
      }
    };

    const createClone = (li, wrapper) => {
      const clone = li.cloneNode(true);
      clone.setAttribute('data-cloned', 'true');

      const radio = clone.querySelector('input[type="radio"]');
      const label = clone.querySelector('label');

      if (radio) {
        radio.id += '-cloned';
        radio.removeAttribute('name');
        label?.setAttribute('for', radio.id);
      }

      clone.onclick = e => {
        e.stopPropagation();
        closeDropdown(wrapper);
        const orig = li.querySelector('input[type="radio"]');
        if (orig) {
          orig.checked = true;
          orig.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };

      return clone;
    };

    wrappers.forEach(wrapper => {
      if (wrapper.closest('.product-selector--buttons')) return;
      wrapper.dataset.open = 'false';

      wrapper.addEventListener('click', (e) => {
        if (e.target.closest('li[data-cloned]')) return;

        const target = e.target;
        const optionItem = target.closest('.product-options__item');

        if (optionItem && !optionItem.closest('li[data-cloned]')) {
          const radioInput = optionItem.querySelector('input[type="radio"]');
          if (wrapper.dataset.open === 'false') {
            wrappers.forEach(w => w !== wrapper && closeDropdown(w));
            wrapper.dataset.open = 'true';
            const ul = wrapper.querySelector('ul');
            const selected = ul.querySelector('.product-options__item.is-active');

            if (selected) ul.insertBefore(createClone(selected.closest('li'), wrapper), ul.firstElementChild);
            ul.querySelectorAll('li').forEach(li => (li.style.display = 'block'));

            e.stopPropagation();
            return;
          }

          if (radioInput && !radioInput.checked) {
            closeDropdown(wrapper);

            // Uncheck all radios in this group first
            const allRadiosInGroup = wrapper.querySelectorAll('input[type="radio"]');
            allRadiosInGroup.forEach(radio => {
              radio.checked = false;
              radio.closest('.product-options__item')?.classList.remove('is-active');
            });

            // Check the selected radio
            radioInput.checked = true;
            optionItem.classList.add('is-active');

            // Update options and trigger change
            this.updateOptions();
            radioInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        } else {
          wrappers.forEach(w => w !== wrapper && closeDropdown(w));

          if (wrapper.dataset.open === 'true') {
            closeDropdown(wrapper);
          } else {
            wrapper.dataset.open = 'true';
            const ul = wrapper.querySelector('ul');
            const selected = ul.querySelector('.product-options__item.is-active');

            if (selected) ul.insertBefore(createClone(selected.closest('li'), wrapper), ul.firstElementChild);
            ul.querySelectorAll('li').forEach(li => (li.style.display = 'block'));
          }
        }

        e.stopPropagation();
      });
    });

    // Add global click event to close open dropdowns when clicking outside
    window.addEventListener('click', (e) => {
      wrappers.forEach(wrapper => {
        if (!wrapper.contains(e.target)) {
          closeDropdown(wrapper);
        }
      });
    });
  }
}
customElements.define('product-selector', ProductSelector);
}
