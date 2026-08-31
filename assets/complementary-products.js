(() => {
  if (customElements.get('complementary-products')) {
    return;
  }

  class ComplementaryProducts extends customElements.get(
    'card-product-slider'
  ) {
    constructor() {
      super();

      const swiperOptions = JSON.parse(this.getAttribute('data-swiper-options')) || {};

      const pageGutterValue = getComputedStyle(document.documentElement).getPropertyValue('--page-gutter').trim();
      const pageGutterInPx = parseFloat(pageGutterValue) * 10;

      this.sliderOptions = {
        slidesPerView: 1.3,
        spaceBetween: 2,
        slidesOffsetAfter: pageGutterInPx,
        navigation: {
          nextEl: this.parent.querySelector('.swiper-button--next'),
          prevEl: this.parent.querySelector('.swiper-button--prev')
        },
        breakpoints: {
          990: {
            slidesPerView: swiperOptions.slidesPerViewDesktop || 2,
            slidesPerGroup: 2,
            slidesOffsetAfter: 0
          }
        }
      };
    }

    initSlider() {
      super.initSlider();
      this.parentElement.classList.remove('hidden');
    }
  }

  customElements.define(
    'complementary-products',
    ComplementaryProducts
  );
})();
