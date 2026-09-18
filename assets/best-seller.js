if (!customElements.get('best-seller-slider')) {
  class BestSellerSlider extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('.best-seller__track');
      if (!this.track) return;

      this.offset = 0;
      this.direction = 1;
      this.speed = 32;
      this.paused = false;
      this.hovering = false;
      this.animating = false;
      this.setWidth = 0;
      this.raf = null;
      this.lastTime = 0;
      this.originalCount = this.track.querySelectorAll('.best-seller__slide:not([data-clone])').length;

      this.prepareLoop();
      this.sizeSlides();
      requestAnimationFrame(() => {
        this.measure();
        this.start();
      });
      this.bind();
    }

    disconnectedCallback() {
      this.stop();
      window.removeEventListener('resize', this.onResize);
    }

    prepareLoop() {
      this.track.querySelectorAll('[data-clone]').forEach((node) => node.remove());
      const originals = [...this.track.querySelectorAll('.best-seller__slide')];
      if (originals.length < 2) return;

      originals.forEach((slide) => {
        const clone = slide.cloneNode(true);
        clone.setAttribute('data-clone', 'true');
        clone.setAttribute('aria-hidden', 'true');
        clone.querySelectorAll('a, button').forEach((el) => el.setAttribute('tabindex', '-1'));
        this.track.appendChild(clone);
      });
    }

    slideRatio() {
      const width = window.innerWidth;
      if (width >= 1140) return 1 / 3.91;
      if (width >= 750) return 1 / 3.02;
      return 0.657;
    }

    sizeSlides() {
      const slideWidth = Math.round(this.clientWidth * this.slideRatio());
      this.track.querySelectorAll('.best-seller__slide').forEach((slide) => {
        slide.style.flex = `0 0 ${slideWidth}px`;
        slide.style.width = `${slideWidth}px`;
      });
    }

    measure() {
      const originals = [...this.track.querySelectorAll('.best-seller__slide:not([data-clone])')];
      if (!originals.length) {
        this.setWidth = 0;
        return;
      }

      const first = originals[0].getBoundingClientRect();
      const last = originals[originals.length - 1].getBoundingClientRect();
      this.setWidth = last.right - first.left + 2;
    }

    bind() {
      const root = this.closest('.best-seller');
      const wrap = this.closest('.best-seller__slider-wrap');

      const pause = () => {
        this.hovering = true;
        this.paused = true;
      };
      const resume = () => {
        this.hovering = false;
        if (!this.animating) {
          this.paused = false;
          this.lastTime = 0;
        }
      };

      wrap.addEventListener('mouseenter', pause);
      wrap.addEventListener('mouseleave', resume);
      wrap.addEventListener('touchstart', pause, { passive: true });
      wrap.addEventListener('touchend', resume, { passive: true });
      wrap.addEventListener('touchcancel', resume, { passive: true });

      const prev = root && root.querySelector('.best-seller__nav-button--prev');
      const next = root && root.querySelector('.best-seller__nav-button--next');
      const nav = root && root.querySelector('.best-seller__nav');
      if (prev) prev.addEventListener('click', () => this.slideBy(-1));
      if (next) next.addEventListener('click', () => this.slideBy(1));
      if (nav) {
        nav.addEventListener('mouseenter', pause);
        nav.addEventListener('mouseleave', resume);
      }

      this.onResize = () => {
        this.sizeSlides();
        this.measure();
        this.offset = this.setWidth ? this.offset % this.setWidth : 0;
        this.render();
      };
      window.addEventListener('resize', this.onResize);

      if (root) {
        root.addEventListener('click', (event) => this.onRootClick(event));
      }
    }

    start() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (this.originalCount < 2 || this.setWidth <= 0) return;

      const tick = (time) => {
        if (!this.lastTime) this.lastTime = time;
        const delta = (time - this.lastTime) / 1000;
        this.lastTime = time;

        if (!this.paused && !this.animating && this.setWidth > 0) {
          this.offset += this.speed * this.direction * delta;
          if (this.offset >= this.setWidth) this.offset -= this.setWidth;
          if (this.offset < 0) this.offset += this.setWidth;
          this.render();
        }

        this.raf = requestAnimationFrame(tick);
      };

      this.raf = requestAnimationFrame(tick);
    }

    slideWidth() {
      const slide = this.track.querySelector('.best-seller__slide');
      if (!slide) return 0;
      return slide.getBoundingClientRect().width + 2;
    }

    wrapOffset(value) {
      if (!this.setWidth) return 0;
      return ((value % this.setWidth) + this.setWidth) % this.setWidth;
    }

    slideBy(direction) {
      if (this.animating || !this.setWidth) return;

      const distance = this.slideWidth();
      if (!distance) return;

      this.animating = true;
      this.paused = true;

      let start = this.offset;
      if (direction < 0 && start < distance) {
        start += this.setWidth;
        this.offset = start;
        this.render();
      }

      const end = start + direction * distance;
      const duration = 450;
      const startedAt = performance.now();
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);

      const step = (now) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        this.offset = start + (end - start) * easeOut(progress);
        this.render();

        if (progress < 1) {
          requestAnimationFrame(step);
          return;
        }

        this.offset = this.wrapOffset(end);
        this.render();
        this.animating = false;
        if (!this.hovering) {
          this.paused = false;
          this.lastTime = 0;
        }
      };

      requestAnimationFrame(step);
    }

    render() {
      this.track.style.transform = `translate3d(${-this.offset}px, 0, 0)`;
    }

    stop() {
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null;
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

      const config =
        typeof fetchConfig === 'function'
          ? fetchConfig('javascript')
          : { method: 'POST', headers: { Accept: 'application/javascript' } };
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
