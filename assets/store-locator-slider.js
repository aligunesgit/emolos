if (!customElements.get('store-locator-slider')) {
  class StoreLocatorSlider extends HTMLElement {
    constructor() {
      super();

      const swiperOptions =
        JSON.parse(this.getAttribute('data-swiper-options')) || {};

      this.initSlider(swiperOptions);

      if (this.classList.contains('store-locator-slider-filtered')) {
        this.reInitSlider(swiperOptions);
      }
    }

    reInitSlider(swiperOptions) {
      this.slider.destroy();
      this.initSlider(swiperOptions);
    }

    initSlider(swiperOptions) {
      this.slider = new Swiper(this, {
        slidesPerView: 1.1,
        spaceBetween: swiperOptions.spaceBetweenMobile || 16,
        resistanceRatio: 0.72,
        observer: true,
        observerParents: true,
        observeSlideChildren: true,
        initialSlide: 0,
        breakpoints: {
          991: {
            enabled: false
          },
          990: {
            enabled: true,
            slidesPerView: 3,
            spaceBetween: swiperOptions.spaceBetweenDesktop || 16,
            loop: false
          },
          750: {
            enabled: true,
            slidesPerView: 2,
            spaceBetween: swiperOptions.spaceBetweenDesktop || 16,
            loop: false
          }
        }
      });
    }
  }

  customElements.define('store-locator-slider', StoreLocatorSlider);
}
