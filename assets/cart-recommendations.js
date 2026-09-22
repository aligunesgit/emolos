class CartRecommendations extends HTMLElement {
  constructor() {
    super();
    this.slider = null;
  }

  connectedCallback() {
    this.performRecommendations();
  }

  disconnectedCallback() {
    if (this.slider && typeof this.slider.destroy === 'function') {
      this.slider.destroy(true, true);
      this.slider = null;
    }
  }

  performRecommendations() {
    const recommendations = this.querySelector('[data-recommendations]');
    if (!recommendations) return;

    this.fetchRecommendations(this.dataset.url).then(html => {
      if (html) {
        this.renderRecommendations(recommendations, html);
        return;
      }

      const fallbackUrl = this.dataset.url.replace('intent=related', 'intent=complementary');
      if (fallbackUrl === this.dataset.url) return;

      this.fetchRecommendations(fallbackUrl).then(fallbackHtml => {
        if (!fallbackHtml) return;
        this.renderRecommendations(recommendations, fallbackHtml);
      });
    });
  }

  fetchRecommendations(url) {
    return fetch(url)
      .then(response => response.text())
      .then(text => {
        const node = new DOMParser()
          .parseFromString(text, 'text/html')
          .querySelector('[data-recommendations]');
        const html = node ? node.innerHTML.trim() : '';
        return html;
      })
      .catch(() => '');
  }

  renderRecommendations(container, html) {
    this.classList.remove('hidden');
    container.innerHTML = html;
    this.initSlider();
  }

  initSlider() {
    if (typeof Swiper === 'undefined') return;
    const el = this.querySelector('.swiper');
    if (!el) return;

    if (this.slider && typeof this.slider.destroy === 'function') {
      this.slider.destroy(true, true);
    }

    this.slider = new Swiper(el, {
      slidesPerView: 2.15,
      spaceBetween: 10,
      watchOverflow: true,
      navigation: {
        nextEl: this.querySelector('[data-rec-next]'),
        prevEl: this.querySelector('[data-rec-prev]')
      }
    });
  }
}

customElements.define('cart-recommendations', CartRecommendations);
