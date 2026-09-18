if (!customElements.get('best-seller-slider')) {
  class BestSellerSlider extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('.best-seller__track');
      if (!this.track) return;

      this.gap = 2;
      this.index = 0;
      this.offset = 0;
      this.setWidth = 0;
      this.animating = false;
      this.dragging = false;
      this.dragStartX = 0;
      this.dragStartOffset = 0;
      this.moved = false;

      this.prepareLoop();
      this.sizeSlides();
      requestAnimationFrame(() => {
        this.measure();
        this.offset = this.offsetFor(0);
        this.render(false);
      });
      this.bind();
    }

    disconnectedCallback() {
      window.removeEventListener('resize', this.onResize);
    }

    originals() {
      return [...this.track.querySelectorAll('.best-seller__slide:not([data-clone])')];
    }

    prepareLoop() {
      this.track.querySelectorAll('[data-clone]').forEach((node) => node.remove());
      const originals = this.originals();
      if (originals.length < 2) return;

      originals.forEach((slide) => {
        const after = slide.cloneNode(true);
        after.setAttribute('data-clone', 'true');
        after.setAttribute('aria-hidden', 'true');
        after.querySelectorAll('a, button').forEach((el) => el.setAttribute('tabindex', '-1'));
        this.track.appendChild(after);
      });

      originals
        .slice()
        .reverse()
        .forEach((slide) => {
          const before = slide.cloneNode(true);
          before.setAttribute('data-clone', 'true');
          before.setAttribute('aria-hidden', 'true');
          before.querySelectorAll('a, button').forEach((el) => el.setAttribute('tabindex', '-1'));
          this.track.insertBefore(before, this.track.firstChild);
        });
    }

    slideRatio() {
      const width = window.innerWidth;
      if (width >= 1140) return 1 / 4.07;
      if (width >= 750) return 1 / 3.2;
      return 0.62;
    }

    sizeSlides() {
      const slideWidth = Math.round(this.clientWidth * this.slideRatio());
      this.track.querySelectorAll('.best-seller__slide').forEach((slide) => {
        slide.style.flex = `0 0 ${slideWidth}px`;
        slide.style.width = `${slideWidth}px`;
      });
    }

    cardWidth() {
      const slide = this.track.querySelector('.best-seller__slide');
      return slide ? slide.getBoundingClientRect().width : 0;
    }

    slideWidth() {
      return this.cardWidth() + this.gap;
    }

    measure() {
      const originals = this.originals();
      if (!originals.length) {
        this.setWidth = 0;
        return;
      }
      this.setWidth = originals.length * this.slideWidth();
    }

    offsetFor(index) {
      const card = this.cardWidth();
      const peek = (this.clientWidth - card) / 2;
      return this.setWidth + index * this.slideWidth() - peek;
    }

    wrapOffset(value) {
      if (!this.setWidth) return 0;
      let next = value;
      while (next < this.setWidth * 0.5) next += this.setWidth;
      while (next >= this.setWidth * 1.5) next -= this.setWidth;
      return next;
    }

    nearestIndex(value) {
      const originals = this.originals();
      if (!originals.length) return 0;
      const card = this.cardWidth();
      const peek = (this.clientWidth - card) / 2;
      const raw = (value + peek - this.setWidth) / this.slideWidth();
      const count = originals.length;
      return ((Math.round(raw) % count) + count) % count;
    }

    bind() {
      const root = this.closest('.best-seller');
      const prev = root && root.querySelector('.best-seller__nav-button--prev');
      const next = root && root.querySelector('.best-seller__nav-button--next');
      if (prev) prev.addEventListener('click', () => this.slideBy(-1));
      if (next) next.addEventListener('click', () => this.slideBy(1));

      this.addEventListener('pointerdown', this.onPointerDown);
      this.addEventListener('click', this.onClickCapture, true);

      this.onResize = () => {
        this.sizeSlides();
        this.measure();
        this.offset = this.offsetFor(this.index);
        this.render(false);
      };
      window.addEventListener('resize', this.onResize);

      if (root) {
        root.addEventListener('click', (event) => this.onRootClick(event));
      }
    }

    onPointerDown = (event) => {
      if (event.button != null && event.button !== 0) return;
      if (event.target.closest('button')) return;

      this.dragging = true;
      this.moved = false;
      this.dragStartX = event.clientX;
      this.dragStartOffset = this.offset;
      this.setPointerCapture(event.pointerId);
      this.classList.add('is-dragging');
      this.addEventListener('pointermove', this.onPointerMove);
      this.addEventListener('pointerup', this.onPointerUp);
      this.addEventListener('pointercancel', this.onPointerUp);
    };

    onPointerMove = (event) => {
      if (!this.dragging) return;
      const delta = event.clientX - this.dragStartX;
      if (Math.abs(delta) > 6) this.moved = true;
      this.offset = this.dragStartOffset - delta;
      this.render(false);
    };

    onPointerUp = () => {
      if (!this.dragging) return;
      this.dragging = false;
      this.classList.remove('is-dragging');
      this.removeEventListener('pointermove', this.onPointerMove);
      this.removeEventListener('pointerup', this.onPointerUp);
      this.removeEventListener('pointercancel', this.onPointerUp);
      this.index = this.nearestIndex(this.offset);
      this.animateTo(this.offsetFor(this.index));
    };

    onClickCapture = (event) => {
      if (!this.moved) return;
      event.preventDefault();
      event.stopPropagation();
    };

    slideBy(direction) {
      const originals = this.originals();
      if (!originals.length || this.animating) return;
      this.index = (this.index + direction + originals.length) % originals.length;
      this.animateTo(this.offsetFor(this.index));
    }

    animateTo(end) {
      const start = this.offset;
      let target = end;
      const distance = this.setWidth;
      if (distance && Math.abs(target - start) > distance / 2) {
        if (target > start) target -= distance;
        else target += distance;
      }

      this.animating = true;
      const duration = 420;
      const startedAt = performance.now();
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);

      const step = (now) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        this.offset = start + (target - start) * easeOut(progress);
        this.render(false);
        if (progress < 1) {
          requestAnimationFrame(step);
          return;
        }
        this.offset = this.wrapOffset(target);
        this.index = this.nearestIndex(this.offset);
        this.render(false);
        this.animating = false;
      };

      requestAnimationFrame(step);
    }

    render() {
      this.track.style.transform = `translate3d(${-this.offset}px, 0, 0)`;
    }

    onRootClick(event) {
      const sizeButton = event.target.closest('.best-seller__size');
      if (sizeButton && !sizeButton.disabled) {
        const card = sizeButton.closest('.best-seller__card');
        card.querySelectorAll('.best-seller__size').forEach((el) => el.classList.remove('is-selected'));
        sizeButton.classList.add('is-selected');
        const add = card.querySelector('.best-seller__add');
        if (add) {
          add.dataset.variantId = sizeButton.dataset.variantId;
          add.disabled = false;
        }
        return;
      }

      const addButton = event.target.closest('.best-seller__add');
      if (addButton) {
        event.preventDefault();
        this.addToCart(addButton);
      }
    }

    async addToCart(button) {
      if (button.disabled || button.dataset.loading === 'true') return;
      const variantId = button.dataset.variantId;
      if (!variantId) return;

      button.dataset.loading = 'true';
      const cartDrawer = document.querySelector('cart-drawer');
      const formData = new FormData();
      formData.append('id', variantId);
      formData.append('quantity', '1');

      const config = typeof fetchConfig === 'function' ? fetchConfig('javascript') : { method: 'POST', headers: { Accept: 'application/javascript' } };
      config.headers = config.headers || {};
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];

      if (cartDrawer && typeof cartDrawer.getSectionsToRender === 'function') {
        formData.append(
          'sections',
          cartDrawer.getSectionsToRender().map((section) => section.section)
        );
        formData.append('sections_url', window.location.pathname);
      }

      config.body = formData;

      try {
        const response = await fetch(window.routes.cart_add_url, config);
        const data = await response.json();
        if (data.status) return;
        if (cartDrawer && typeof cartDrawer.renderContents === 'function') {
          cartDrawer.renderContents(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        button.dataset.loading = 'false';
      }
    }
  }

  customElements.define('best-seller-slider', BestSellerSlider);
}
