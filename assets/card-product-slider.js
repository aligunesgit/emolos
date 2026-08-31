if (!customElements.get('card-product-slider')) {
  class CardProductSlider extends HTMLElement {
    constructor() {
      super();

      const swiperOptions = JSON.parse(this.getAttribute('data-swiper-options')) || {};

      this.sliderWrapper = this.querySelector('.swiper-wrapper');
      this.requiresFetch = this.hasAttribute('data-url');
      this.parent = this.closest('[data-section-id]');
      this.sliderOptions = {
        a11y: false,
        threshold: 3,
        spaceBetween: swiperOptions.spaceBetweenMobile || 2,
        slidesPerView: 'auto',
        resistanceRatio: 0.72,
        navigation: {
          nextEl: '.swiper-button--next',
          prevEl: '.swiper-button--prev'
        },
        breakpoints: {
          750: {
            slidesPerView: 3,
            spaceBetween: swiperOptions.spaceBetweenDesktop || 2
          },
          1100: {
            slidesPerView: 4,
            spaceBetween: swiperOptions.spaceBetweenDesktop || 2
          }
        }
      };
    }

    connectedCallback() {
      if (this.requiresFetch) {
        this.fetchItems();
        return;
      }
      this.initSlider();
    }

    fetchItems() {
      if (!this.parent) throw new Error('Parent is missing');
      fetch(this.getAttribute('data-url'))
        .then(response => response.text())
        .then(text => {
          const html = new DOMParser().parseFromString(
            text,
            'text/html'
          );
          const wrapper = html.querySelector('.swiper-wrapper');

          if (wrapper && wrapper.innerHTML.trim().length) {
            this.querySelector('.swiper-wrapper').innerHTML =
              wrapper.innerHTML;
            this.parent.classList.remove('hidden');
            this.initSlider();
          }
        })
        .catch(e => {
          console.error(e);
        });
    }

    initSlider(slider = this) {
      if (this.slider) return;
      this.slider = new Swiper(slider, this.sliderOptions);

      const isShopTheLook = this.classList.contains('section-shop-the-look__slider')
      if (isShopTheLook) return;

      this.slider.wrapperEl.setAttribute('aria-live', 'polite');
      this.slider.wrapperEl.id = `swiper-wrapper-${this.dataset.sectionId}`;
      this.slider.slides.forEach((slide, i) => {
        slide.setAttribute('role', 'group');
        slide.setAttribute(
          'aria-label',
          `${i + 1} / ${this.slider.slides.length}`
        );
        slide.dataset.index = i;
      });
      const sliderButtons = [
        this.slider.navigation.prevEl,
        this.slider.navigation.nextEl
      ];

      sliderButtons.forEach((button, i) => {
        let type = 'Previous';

        if (i === 1) {
          type = 'Next';
        }

        button.setAttribute('aria-label', `${type} slide`);
        button.setAttribute(
          'aria-controls',
          this.slider.wrapperEl.id
        );
      });

      this.slider.wrapperEl.addEventListener('focusin', e => {
        // if clicked element is a button, input, textarea, select, prevent scrolling
        if (e.target.closest('button, a, input, textarea, select')) return;

        this.slider.el.scrollLeft = 0;

        const slide = e.target.closest('.swiper-slide');
        if (!slide) return;

        const slideIndex = +slide.dataset.index;
        const isFirstSlide = slideIndex === 0;
        const isLastSlide = slideIndex === this.slider.slides.length - 1;

        if (isFirstSlide || isLastSlide) {
          this.slider.slideTo(slideIndex, 0);
          return;
        }

        const slideRect = slide.getBoundingClientRect();
        const wrapperWidth = this.slider.wrapperEl.clientWidth;
        const slideLeft = slideRect.x + slideRect.width - (document.body.clientWidth - wrapperWidth) / 2;
        const isSlideVisible = slideLeft <= wrapperWidth && slideLeft >= slideRect.width;

        if (isSlideVisible) return;

        slideLeft >= slideRect.width
          ? this.slider.slideNext(0)
          : this.slider.slidePrev(0);
      });
    }
  }

  customElements.define('card-product-slider', CardProductSlider);
}

document.addEventListener('shopify:section:load', event => {
  const section = event.target.querySelector('card-product-slider');
  if (section) {
    section.connectedCallback();
  }
});
