if (!customElements.get('announcement-bar-slider')) {
  class AnnouncementBarSlider extends HTMLElement {
    constructor() {
      super();

      const swiperOptions = JSON.parse(this.getAttribute('data-swiper-options')) || {};

      this.initSlider(swiperOptions);

      window.addEventListener('shopify:section:load', e => {
        this.initSlider(swiperOptions);
      });
    }

    initSlider(swiperOptions) {
      this.slider = new Swiper(this, {
        slidesPerView: 1,
        loop: swiperOptions.loop || false,
        allowTouchMove: false,
        autoplay: swiperOptions.autoplay || false,
      });
    }
  }

  customElements.define('announcement-bar-slider', AnnouncementBarSlider);
}
