if (!customElements.get('shop-by-category-slider')) {
  class ShopByCategorySlider extends HTMLElement {
    connectedCallback() {
      const start = () => {
        if (this.swiper || typeof Swiper === 'undefined') return;

        const slideCount = this.querySelectorAll('.swiper-slide').length;
        const wrap = this.closest('.shop-by-category__slider-wrap');

        this.swiper = new Swiper(this, {
          slidesPerView: 1.61,
          spaceBetween: 2,
          speed: 500,
          rewind: slideCount > 2,
          grabCursor: true,
          resistanceRatio: 0.72,
          followFinger: true,
          allowTouchMove: slideCount > 1,
          watchOverflow: true,
          navigation: {
            nextEl: wrap ? wrap.querySelector('.swiper-button--next') : null,
            prevEl: wrap ? wrap.querySelector('.swiper-button--prev') : null
          },
          breakpoints: {
            750: {
              slidesPerView: 3,
              spaceBetween: 2
            },
            1200: {
              slidesPerView: 4,
              spaceBetween: 2
            }
          }
        });
      };

      if (typeof Swiper !== 'undefined') {
        start();
      } else {
        window.addEventListener('load', start, { once: true });
      }
    }
  }

  customElements.define('shop-by-category-slider', ShopByCategorySlider);
}
