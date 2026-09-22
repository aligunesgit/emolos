(() => {
  if (customElements.get('bundle-pack')) return;

  const formatMoney = (cents, format) => {
    if (window.Shopify && typeof window.Shopify.formatMoney === 'function') {
      return window.Shopify.formatMoney(cents, format);
    }
    const value = (Number(cents) / 100).toFixed(2);
    if (!format) return value;
    return format
      .replace(/\{\{\s*amount\s*\}\}/, value)
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/, String(Math.round(Number(cents) / 100)))
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/, value.replace('.', ','));
  };

  class BundlePack extends HTMLElement {
    connectedCallback() {
      this.packSize = Number(this.dataset.packSize || 3);
      this.packPercent = Number(this.dataset.packPercent || 30);
      this.moneyFormat = this.dataset.moneyFormat || '{{amount}}';
      this.items = [];
      this.slotsEl = this.querySelector('[data-bundle-slots]');
      this.compareEl = this.querySelector('[data-bundle-compare]');
      this.saleEl = this.querySelector('[data-bundle-sale]');
      this.checkoutBtn = this.querySelector('[data-bundle-checkout]');

      this.renderSlots();
      this.querySelectorAll('[data-bundle-add]').forEach((btn) => {
        btn.addEventListener('click', () => this.addFromCard(btn.closest('.bundle-pack__card')));
      });
      this.checkoutBtn?.addEventListener('click', () => this.checkout());
    }

    addFromCard(card) {
      if (!card) return;
      const field = card.querySelector('[data-bundle-variant]');
      if (!field) return;
      const option = field.tagName === 'SELECT' ? field.selectedOptions[0] : field;
      const variantId = Number(field.value);
      const price = Number(option?.dataset.price || field.dataset.price || 0);
      const title = field.dataset.title || '';
      const image = field.dataset.image || '';
      const existing = this.items.findIndex((item) => item.variantId === variantId);

      if (existing > -1) {
        this.items.splice(existing, 1);
        card.querySelector('[data-bundle-add]')?.classList.remove('is-in-pack');
        this.renderSlots();
        return;
      }

      if (this.items.length >= this.packSize) {
        return;
      }

      this.items.push({ variantId, price, title, image, card });
      card.querySelector('[data-bundle-add]')?.classList.add('is-in-pack');
      this.renderSlots();
    }

    renderSlots() {
      if (!this.slotsEl) return;
      const slots = [];
      for (let i = 0; i < this.packSize; i += 1) {
        const item = this.items[i];
        slots.push(
          item
            ? `<div class="bundle-pack__slot"><img src="${item.image}" alt=""></div>`
            : `<div class="bundle-pack__slot"></div>`
        );
      }
      this.slotsEl.innerHTML = slots.join('');

      const total = this.items.reduce((sum, item) => sum + item.price, 0);
      const sale = Math.round(total * (1 - this.packPercent / 100));
      if (this.compareEl) {
        this.compareEl.textContent = total ? formatMoney(total, this.moneyFormat) : '';
      }
      if (this.saleEl) {
        this.saleEl.textContent = total ? formatMoney(sale, this.moneyFormat) : '';
      }
      if (this.checkoutBtn) {
        this.checkoutBtn.disabled = this.items.length !== this.packSize;
      }
    }

    async checkout() {
      if (this.items.length !== this.packSize || this.checkoutBtn.disabled) return;
      this.checkoutBtn.disabled = true;
      try {
        const response = await fetch(this.dataset.addUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            items: this.items.map((item) => ({
              id: item.variantId,
              quantity: 1,
              properties: { _pack: '3-item-30-off' }
            }))
          })
        });
        const json = await response.json();
        if (json.status) {
          this.checkoutBtn.disabled = false;
          return;
        }
        const code = (this.dataset.discountCode || '').trim();
        if (code) {
          window.location.href = `/discount/${encodeURIComponent(code)}?redirect=${encodeURIComponent(this.dataset.cartUrl || '/cart')}`;
          return;
        }
        window.location.href = this.dataset.cartUrl || '/cart';
      } catch (error) {
        this.checkoutBtn.disabled = false;
      }
    }
  }

  customElements.define('bundle-pack', BundlePack);
})();
