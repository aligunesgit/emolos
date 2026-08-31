if (!customElements.get('shoppable-layout-tags')) {
  class ShoppableLayoutTags extends HTMLElement {
    constructor() {
      super();
      if (Shopify.designMode) {
        window.addEventListener('shopify:section:load', this.observeSection.bind(this));
      }
      this.observeSection();
    }

    observeSection() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.init();
            observer.unobserve(this);
          }
        });
      }, { threshold: 0.1 });
      observer.observe(this);
    }

    init () {
      const swiperTagSlides = this.querySelector('.swiper-tag-desktop');
      const slidesPerViewDesktop = swiperTagSlides.dataset.slidesPerviewDesktop;

      this.swiper = new Swiper(swiperTagSlides, {
          // loop: true,
          freeMode: true,
          slidesPerView: 4,
          spaceBetween: 16,
          navigation: {
            nextEl: '.swiper-button--next',
            prevEl:'.swiper-button--prev',
          },
          breakpoints: {
            1200: {
              freeMode: true,
              slidesPerView: slidesPerViewDesktop,
              spaceBetween: 16,
            },
            1100: {
              freeMode: true,
              slidesPerView: 4,
              spaceBetween: 10,
            },
            750: {
              spaceBetween: 5
            }
          },
          on: {
            init: () => {
              document.querySelector('.swiper-tag-desktop').removeAttribute('style');
              this.updateNavigationVisibility();
            },
            resize: () => this.updateNavigationVisibility()
          }
        });
      this.swiperMobile = new Swiper(this.querySelector('.swiper-tag-mobile'), {
        freeMode: true,
        centeredSlides: true,
        spaceBetween: 24,
        navigation: {
          nextEl: '.swiper-button--next',
          prevEl:'.swiper-button--prev',
        },
        on: {
          init: () => document.querySelector('.swiper-tag-mobile').removeAttribute('style')
        }
      });
    }

    updateNavigationVisibility() {
      const swiperContainer = this.querySelector('.swiper-tag-desktop');
      const slides = swiperContainer.querySelectorAll('.swiper-slide');
      const nextButton = swiperContainer.querySelector('.swiper-button--next');
      const prevButton = swiperContainer.querySelector('.swiper-button--prev');
      const slidesPerView = this.swiper?.params.slidesPerView;

      if (slides.length <= slidesPerView) {
        nextButton.style.display = 'none';
        prevButton.style.display = 'none';
      } else {
        nextButton.style.display = 'block';
        prevButton.style.display = 'block';
      }
      const swiperButtonsContainer = document.querySelector(".shoppable__layout--tags .swiper__buttons");

      if (prevButton && nextButton && prevButton.disabled && nextButton.disabled) {
        swiperButtonsContainer.style.marginBlockStart = "0";
      }
    }

    slideTo(index) {
      this.swiper.slideTo(index);
    }
  }

  customElements.define('shoppable-layout-tags', ShoppableLayoutTags);
}
