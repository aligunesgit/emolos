if (!customElements.get('hero-slider')) {
  class HeroSlider extends HTMLElement {
    constructor() {
      super();

      this.mountSlider();

      window.addEventListener('shopify:block:select', e => {
        if (!e.target.closest('hero-slider')) return;

        const selectedSlideIndex = +e.target.dataset.index;
        this.slider.slideTo(selectedSlideIndex, 600);
      });

      this.addKeyboardNavigation();
    }

    mountSlider() {
      const autoplayOptions = {
        delay: this.dataset.autoplayInterval
      };

      this.slider = new Swiper(this, {
        effect: 'fade',
        rewind: true,
        slidesPerView: 1,
        speed: 600,
        followFinger: false,
        navigation: {
          nextEl: '.swiper-button--next',
          prevEl: '.swiper-button--prev'
        },
        autoplay:
          this.dataset.autoplay === 'true' ? autoplayOptions : false,
        on: {
          init: this.handleSlideChange.bind(this),
          slideChange: this.handleSlideChange.bind(this)
        }
      });
    }

    handleSlideChange(swiper) {
      const headerInner = document.querySelector('.header__inner');
      const heroInners = document.querySelectorAll('.hero__inner');
      const swiperButtons = this.querySelectorAll('.swiper-button');

      if (!headerInner || !heroInners || !swiperButtons) {
        return;
      }

      // change --transparent-header-menu-text-color value on document style attributes
      document.documentElement.style.setProperty(
        '--transparent-header-menu-text-color',
        heroInners[swiper.activeIndex].dataset.headerMenuTextColor
      );

      // change hero banner slider arrow color with active slider's text color
      const activeSlide = this.querySelectorAll('.hero__inner')[swiper.activeIndex];
      const computedStyle = getComputedStyle(activeSlide);

      const headingColor = computedStyle.getPropertyValue('--color-heading-text').trim();;
      if (swiperButtons) {
        swiperButtons.forEach(button => {
          button.style.setProperty('--color-button-swiper', `rgb(${headingColor})`)
        });
      }
    }


    addKeyboardNavigation() {
      document.addEventListener('keydown', (event) => {
        if (this.isInViewport()) {
          if (event.key === 'ArrowRight') {
            const nextButton = this.querySelector('.swiper-button--next');
            if (nextButton) {
              nextButton.click();
            }
          }
          if (event.key === 'ArrowLeft') {
            const prevButton = this.querySelector('.swiper-button--prev');
            if (prevButton) {
              prevButton.click();
            }
          }
        }
      });
    }

    isInViewport() {
      const rect = this.getBoundingClientRect();
      return (
        rect.top < window.innerHeight && // top part in viewport
        rect.bottom > 0 && // bottom part in viewport
        rect.left < window.innerWidth && // left part in viewport
        rect.right > 0 // right part in viewport
      );
    }
  }

  customElements.define('hero-slider', HeroSlider);
}
