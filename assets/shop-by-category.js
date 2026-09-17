if (!customElements.get('shop-by-category-slider')) {
  class ShopByCategorySlider extends HTMLElement {
    connectedCallback() {
      this.waitForSwiper(() => this.mount());
    }

    disconnectedCallback() {
      if (this.swiper) {
        this.swiper.destroy(true, true);
        this.swiper = null;
      }
    }

    waitForSwiper(callback) {
      if (typeof Swiper !== 'undefined') {
        callback();
        return;
      }

      let tries = 0;
      const timer = setInterval(() => {
        tries += 1;
        if (typeof Swiper !== 'undefined' || tries > 40) {
          clearInterval(timer);
          if (typeof Swiper !== 'undefined') callback();
        }
      }, 50);
    }

    mount() {
      if (this.swiper || typeof Swiper === 'undefined') return;

      const slideCount = this.querySelectorAll('.swiper-slide').length;
      const root = this.closest('.shop-by-category');
      const canLoop = slideCount > 2;

      this.swiper = new Swiper(this, {
        slidesPerView: 1.61,
        spaceBetween: 2,
        centeredSlides: true,
        speed: 650,
        loop: canLoop,
        grabCursor: true,
        resistanceRatio: 0.72,
        followFinger: true,
        allowTouchMove: slideCount > 1,
        watchOverflow: true,
        autoplay: canLoop
          ? {
              delay: 2800,
              disableOnInteraction: false,
              pauseOnMouseEnter: true
            }
          : false,
        navigation: {
          nextEl: root ? root.querySelector('.shop-by-category__nav .swiper-button--next') : null,
          prevEl: root ? root.querySelector('.shop-by-category__nav .swiper-button--prev') : null
        },
        breakpoints: {
          750: {
            slidesPerView: 3.2,
            spaceBetween: 2,
            centeredSlides: true
          },
          1140: {
            slidesPerView: 4.15,
            spaceBetween: 2,
            centeredSlides: true
          }
        }
      });
    }
  }

  customElements.define('shop-by-category-slider', ShopByCategorySlider);
}
