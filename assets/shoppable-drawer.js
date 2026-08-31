if (!customElements.get('shoppable-drawer')) {
  class ShoppableDrawer extends HTMLElement {
    constructor() {
      super();
      if (Shopify.designMode) {
        window.addEventListener('shopify:section:load', this.initSwiper.bind(this));
      }
      this.init();
      window.addEventListener('resize', this.handleResize.bind(this));
    }

    init() {
      this.toggleState = false;
      this.layoutMode =this.getAttribute('data-layout-mode')
      this.contentMode = this.getAttribute('data-content-mode');
      this.contentId = this.getAttribute('data-content-id');
      this.layoutStyle = this.getAttribute('data-layout-style');
      if (!this.classList.contains('is--open')) {
        document.querySelector('body').classList.remove('overflow-hidden');
      }

      this.querySelector('.button--close').addEventListener('click', this.close.bind(this));
      this.querySelector('.shoppable-drawer__backdrop').addEventListener('click', this.close.bind(this));

      this.initSwiper();
    }

    initSwiper() {
      if (this.querySelector('.swiper-drawer')) {
        this.swiperDrawer = new Swiper(this.querySelector('.swiper-drawer'), {
          slidesPerView: 1,
          threshold: 30,
          navigation: {
            nextEl: `.swiper__button--next-${this.contentId}`,
            prevEl: `.swiper__button--prev-${this.contentId}`,
          },
          breakpoints: {
            990: {
              autoHeight: false
            },
            360: {
              autoHeight: true
            }
          },
          on: {
            init: () => document.querySelector('.swiper-drawer').removeAttribute('style'),
            slideChange: () => {
              const slideChangeEvent = new CustomEvent('slideChanged');
              document.dispatchEvent(slideChangeEvent);
            }
          }
        });
        if (DeviceDetector.isMobile() || DeviceDetector.isTablet()) {
          this.swiperDrawer.autoHeight = true;
        }
      }
    }

    toggle() {
      if (!this.toggleState) {
        this.open();
      } else {
        this.close();
      }
    }

    handleResize() {
      const wasOpen = this.classList.contains('is--open');
      const wasProductOpen = this.classList.contains('is--open--product');
      const wasBlocksOpen = this.classList.contains('is--open--blocks');

      if (this.swiperDrawer && this.swiperDrawer.destroy) {
        this.swiperDrawer.destroy(true, true);
        this.swiperDrawer = null;
      }

      if (wasOpen) {
        this.style.visibility = 'visible';
        this.style.opacity = '1';
        this.style.transform = 'none';
      }

      this.initSwiper();

      if (wasOpen) {
        if (window.innerWidth >= 990) {
          this.classList.add('is--open');
          this.classList.remove('is--open--product');
          if (this.layoutMode === 'multi') {
            this.classList.add('is--open--blocks');
          }
        } else {
          this.classList.add('is--open');
          if (wasProductOpen) {
            this.classList.add('is--open--product');
          } else if (wasBlocksOpen) {
            this.classList.add('is--open--blocks');
          } else {
            this.classList.remove('is--open--blocks');
          }
        }

        document.body.classList.add('overflow-hidden');
      }

      requestAnimationFrame(() => {
        this.style.removeProperty('visibility');
        this.style.removeProperty('opacity');
        this.style.removeProperty('transform');
      });
    }

    open() {
      this.toggleState = true;
      document.querySelector('body').classList.add('overflow-hidden');

      this.classList.add('is--open');
      if (this.layoutMode === "multi") this.classList.add('is--open--blocks');
      this.opened();
    }

    close() {
      this.toggleState = false;
      document.querySelector('body').classList.remove('overflow-hidden');
      this.classList.remove('is--open');
      if (this.layoutMode === "multi") {
        this.classList.remove('is--open--blocks');
        this.classList.remove('is--open--product');
      }
      this.closed();
      this.toggleAriaExpanded();

      const slideChangeEvent = new CustomEvent('slideChanged');
      document.dispatchEvent(slideChangeEvent);
    }

    openProduct() {
      if (this.layoutMode === "single") {
        if (window.innerWidth < 990) {
          this.classList.add('is--open--product');
          this.classList.add('is--open');
        } else {
          this.open();
        }
      }

      if (this.layoutStyle === 'slider') {
        document.querySelector('.shoppable-drawer__blocks').style.display = 'block';
        const openedSliderDrawer = document.querySelector('.is--open.is--open--blocks')
        if (openedSliderDrawer) {
          openedSliderDrawer?.classList?.remove('is--open');
          openedSliderDrawer?.classList?.remove('is--open--blocks');
          this.classList.add('is--open--product');
          this.classList.add('is--open');
          document.querySelector('.shoppable-drawer__blocks').style.display = 'none';
        }
      }
      if (this.layoutStyle != 'slider' && this.layoutMode != 'single') {
        this.classList.add('is--open--product');
        if (this.contentMode === 'carousel' || this.layoutStyle === 'tags') {
          this.classList.remove('is--open--blocks');
        }
        document.querySelector('.shoppable-drawer__blocks').style.display = 'none';
      }

      const openedDrawer = document.querySelector('.is--open.is--open--blocks');
      if (this.contentMode === 'carousel' && this.layoutStyle != 'slider') {
        if (window.innerWidth < 990 && openedDrawer) {
          setTimeout(() => {
            openedDrawer?.classList?.remove('is--open');
            openedDrawer?.classList?.remove('is--open--blocks');
          }, 0);
        }
      }
      document.addEventListener('click', (event) => {
        const isClickInsideDrawer = this.contains(event.target);
        if (!isClickInsideDrawer) {
          const drawerBlocks = this.querySelector('.shoppable-drawer__blocks');
          if (drawerBlocks) {
            drawerBlocks.style.display = 'block';
          }
        }
      });
    }

    closeProduct() {
      if (this.layoutMode === "single") this.close();
      this.classList.remove('is--open--product');
      if (this.layoutStyle === 'tags') {
        this.classList.add('is--open--blocks');
      }
      document.querySelector('.shoppable-drawer__blocks').style.display = 'block';

      const cardId = this.querySelector('shoppable-product-card')?.getAttribute('data-card-id');
      const templatePartMatch = cardId?.match(/template--\S+/);
      const templatePart = templatePartMatch ? templatePartMatch[0] : null;
      const closedDrawer = document.querySelector(`.shoppable-drawer--${templatePart}`)
      const isListLayout = closedDrawer?.classList?.contains('shoppable-drawer-layout__list')


      if (this.contentMode === 'tags' && !isListLayout) {
        if (window.innerWidth < 990 && templatePart) {
          closedDrawer?.classList?.add('is--open');
          closedDrawer?.classList?.add('is--open--blocks');
        }
      }

      if (this.contentMode === 'carousel' && !isListLayout) {
        if (window.innerWidth < 990 && templatePart) {
          closedDrawer?.classList?.add('is--open');
          closedDrawer?.classList?.add('is--open--blocks');
        }
      }
    }

    openWithIndex(event, index) {
      const isInsideShoppableLayoutDrawer = event.target.closest('shoppable-layout-slider') !== null;
      if (isInsideShoppableLayoutDrawer) {
        const buttonOnSlider = document.querySelector('.is--open.is--open--product')
        buttonOnSlider?.classList?.remove('is--open');
        buttonOnSlider?.classList?.remove('is--open--product');
      }

      if (this.swiperDrawer.length > 1) {
        const drawers = document.querySelectorAll('.shoppable');
        const clickedElement = event.target.closest('.shoppable');
        const drawer_index = Array.from(drawers).indexOf(clickedElement);

        if (this.swiperDrawer[drawer_index]) {
          this.swiperDrawer[drawer_index].slideTo(parseInt(index, 0));
        } else {
          this.swiperDrawer.forEach((drawer, i) => {
            if (drawer.$el[0].classList.contains(`shoppable-drawer-layout__swiper-${this.layoutStyle}`)) {
              this.swiperDrawer[i].slideTo(parseInt(index, 0));
            }
          });
        }
      } else {
        this.swiperDrawer.slideTo(parseInt(index, 0));
      }
      setTimeout(() => {
        this.open();
        this.toggleAriaExpanded(event);
      }, 200);
    }

    openWithTag(event, index) {
      const currentId = `shoppable-drawer__tags--${index}`;
      this.querySelectorAll('.shoppable-drawer__tags').forEach((container) => {
        container.classList.add('hidden');
        if (container.getAttribute('id') === currentId) {
          container.classList.remove('hidden');
        }
      });
      this.open();
      this.toggleAriaExpanded(event);
    }

    toggleAriaExpanded(event) {
      if (event) {
        if (event.target.closest('button')) event.target.closest('button').setAttribute('aria-expanded', true);
        this.querySelector('.button--close').setAttribute('aria-expanded', true);
      } else {
        document.querySelectorAll('[aria-controls="shoppable-drawer"]').forEach((button) => {
          button.setAttribute('aria-expanded', false);
        });
      }
    }

    opened () {
      const openedEvent = new Event('opened', { bubbles: true });
      this.dispatchEvent(openedEvent);
    }

    closed () {
      const closedEvent = new Event('closed', { bubbles: true });
      this.dispatchEvent(closedEvent);
    }

  }

  customElements.define('shoppable-drawer', ShoppableDrawer );
}

