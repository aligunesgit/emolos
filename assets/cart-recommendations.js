class CartRecommendations extends HTMLElement {
  constructor() {
    super();
    this.slider = null;
  }

  connectedCallback() {
    this.performRecommendations();
  }

  performRecommendations() {
    const recommendations = this.querySelector(
      '[data-recommendations]'
    );
    if (!recommendations) return;
    fetch(this.dataset.url)
      .then(response => response.text())
      .then(text => {
        const recommendationsHMTL = new DOMParser()
          .parseFromString(text, 'text/html')
          .querySelector('[data-recommendations]').innerHTML;
        if (!recommendationsHMTL) return;
        this.classList.remove('hidden');
        recommendations.innerHTML = recommendationsHMTL;
        this.initSlider();
      });
  }

  initSlider() {
    this.slider = new Swiper(this.querySelector('.swiper'), {
      slidesPerView: 'auto',
      spaceBetween: 8
    });
  }
}

customElements.define('cart-recommendations', CartRecommendations);
