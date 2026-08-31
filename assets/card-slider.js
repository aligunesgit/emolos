if (!customElements.get('card-slider')) {
  class CardSlider extends HTMLElement {
    constructor() {
      super();

      const swiperOptions = JSON.parse(this.getAttribute('data-swiper-options')) || {};

      this.initSlider(swiperOptions);

      if (this.classList.contains('js-testimonials')) {
        window.addEventListener('resize', () => {
          const isSlideEffect = this.slider.params.effect === 'slide';

          if (DeviceDetector.isMobile() && !isSlideEffect || !DeviceDetector.isMobile() && isSlideEffect) {
            this.reInitSlider(swiperOptions);
          }
        });
      }
    }

    reInitSlider(swiperOptions) {
      this.slider.destroy();
      this.initSlider(swiperOptions);
    }

    initSlider(swiperOptions) {

      let sliderOptions = {
        slidesPerView: 'auto',
        spaceBetween: swiperOptions.spaceBetweenMobile || 2,
        autoplay: swiperOptions.autoplay || false,
        resistanceRatio: 0.72,
        navigation: {
          nextEl: '.swiper-button--next',
          prevEl: '.swiper-button--prev',
        },
        breakpoints: {
          750: {
            slidesPerView: swiperOptions.slidesPerViewDesktop || 3,
            spaceBetween: swiperOptions.spaceBetweenDesktop || 2,
          }
        }
      };

      const isArticlesSlider = this.classList.contains('js-articles');
      const isInCollectionPage = this.classList.contains('featured-collections__slider');
      const isSliderOnlyText = this.classList.contains('text-only');

      if (isArticlesSlider) {
        sliderOptions.breakpoints[575] = {
          slidesPerView: 2,
        };
      } else if (this.classList.contains('js-testimonials')) {
        if (DeviceDetector.isMobile()) {
          sliderOptions.spaceBetween = 4;
          sliderOptions.breakpoints[480] = {
            slidesPerView: 2
          };
          sliderOptions.breakpoints[750].slidesPerView = 1;
        } else {
          sliderOptions = {
            effect: 'fade',
            slidesPerView: 1,
            rewind: true,
            followFinger: false,
            navigation: {
              nextEl: '.swiper-button--next',
              prevEl: '.swiper-button--prev',
            },
            autoplay: swiperOptions.autoplay || false
          };
        }
      } else if (isInCollectionPage) {
        sliderOptions = {
          slidesPerView: 3,
          breakpoints: {
            1400: {
              slidesOffsetBefore: 0,
              slidesPerView: isSliderOnlyText ? 'auto' : 9.3,
              spaceBetween: isSliderOnlyText ? 0 : 24
            },
            1200: {
              slidesOffsetBefore: 0,
              slidesPerView: isSliderOnlyText ? 'auto' : 9,
              spaceBetween: isSliderOnlyText ? 0 : 24
            },
            900: {
              slidesOffsetBefore: 0,
              slidesPerView: isSliderOnlyText ? 'auto' : 7,
              spaceBetween: 16
            },
            750: {
              slidesPerView: isSliderOnlyText ? 'auto' : 6.5,
              spaceBetween: 16
            },
            550: {
              slidesPerView: isSliderOnlyText ? 'auto' : 4.5,
              spaceBetween: 16
            },
            360: {
              slidesPerView: isSliderOnlyText ? 'auto' : 3,
              spaceBetween: 16
            }
          }
        };
      }

      this.slider = new Swiper(this, sliderOptions);
    }
  }

  customElements.define('card-slider', CardSlider);
}
