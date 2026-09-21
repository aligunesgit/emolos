if (!customElements.get('product-media')) {
class ProductMedia extends HTMLElement {
  constructor() {
    super();

    this.selectors = {
      slider: '[data-slider]',
      mediaItem: '[data-media-id]',
      modalOpeners: '[data-modal-opener-id]',
      zoomImages: '[data-pswp-image]',
      btnXr: '[data-shopify-xr]'
    };
    this.selectedMediaIndex =
      Number(
        this.querySelector(this.selectors.slider).querySelector(
          '[data-selected]'
        )?.dataset.index
      ) || 0;

    const swiperOptions = JSON.parse(
      this.querySelector(this.selectors.slider).getAttribute(
        'data-swiper-options'
      )
    );

    if (Shopify.designMode) {
      this.addEventListener('shopify:section:load', event => {
        this.init();
      });
    }
    const withThumbs = this.dataset.withThumbs;

    if (withThumbs === 'true') {
      let setWrapperStyles = function (swiper) {
        let wrapperCenterClass = 'swiper-wrapper__center';
        let buttonDisabledClass = swiper.params.buttonDisabledClass;
        let wrapperEl = swiper.wrapper[0];

        if (
          swiper.prevButton[0].classList.contains(
            buttonDisabledClass
          ) &&
          swiper.nextButton[0].classList.contains(buttonDisabledClass)
        ) {
          // center slides
          wrapperEl.classList.add(wrapperCenterClass);
        } else {
          wrapperEl.classList.remove(wrapperCenterClass);
        }
      };
    }

    const totalSlides = this.querySelectorAll('.swiper-slide').length;
    const isSingleSlide = totalSlides <= 1;

    this.settings = {
      sliderElement: this.querySelector(this.selectors.slider),
      sliderInstance: null,
      options: {
        initialSlide: 0,
        direction: swiperOptions.direction || 'horizontal',
        navigation: isSingleSlide
          ? false
          : {
              prevEl: this.querySelector('.swiper-button--prev'),
              nextEl: this.querySelector('.swiper-button--next')
            },

        pagination: isSingleSlide || swiperOptions.disablePagination
          ? false
          : {
              el: '.swiper-pagination',
              type: 'progressbar'
            },

        spaceBetween: swiperOptions.spaceBetween !== undefined ? swiperOptions.spaceBetween : 2,
        watchOverflow: !isSingleSlide,
        allowTouchMove: !isSingleSlide,
        watchSlidesVisibility: true,
        watchSlidesProgress: true,
        preventInteractionOnTransition: true,
        resistanceRatio: swiperOptions.resistanceRatio !== undefined ? swiperOptions.resistanceRatio : 0.85,

        autoHeight: this.dataset.autoHeight === 'true',

        on: {
          afterInit: swiper => {
            const isSwiperGenerated =
              swiper.slides.length > 1 ? true : false;

            if (isSwiperGenerated) {
              const firstSlide = swiper.slides[0];

              const firstSlideVideo =
                firstSlide.querySelector('video');

              if (firstSlideVideo) {
                this.playPromise(firstSlideVideo);
              }

              // if firstSlide has youtube, play it
              const firstSlideYoutube =
                firstSlide.querySelector('.js-youtube');
              if (firstSlideYoutube) {
                this.playYoutubeVideo(firstSlideYoutube);
              }

              // if firstSlide has vimeo, play it
              const firstSlideVimeo =
                firstSlide.querySelector('.js-vimeo');
              if (firstSlideVimeo) {
                this.playVimeoVideo(firstSlideVimeo);
              }
            }
          },

          reachEnd: swiper => {
            const isInQuickCartModal = this.closest('quick-cart-modal');
            if (isInQuickCartModal && window.innerWidth < 750) {
              swiper.allowSlideNext = false;
            }
          },

          slideChangeTransitionEnd: swiper => {
            this.setActiveModalOpener(swiper);
          },
          transitionStart: swiper => {
            const videos = swiper.el.querySelectorAll('video');
            Array.from(videos).forEach(video => {
              video.pause();
            });
          },
          slideChange: swiper => {
            const isInQuickCartModal = this.closest('quick-cart-modal');
            if (isInQuickCartModal && window.innerWidth < 750 && !swiper.isEnd) {
              swiper.allowSlideNext = true;
            }

            if (window.innerWidth >= 990) {
              const activeIndex = swiper.activeIndex;
              const totalSlides = swiper.slides.length;
              const previousIndex = swiper.previousIndex;

              let isLastSlide = activeIndex === totalSlides - 1;
              let isArrivedLastSlide = false;

              const prevButton = document.querySelector(
                '.swiper-button.swiper-button--prev'
              );
              const swiperContainer = document.querySelector(
                '.product__media .swiper'
              );

              if (prevButton) {
                prevButton.addEventListener('click', () => {
                  isArrivedLastSlide = false;
                  swiperContainer.style.marginInlineStart = '0';
                });
              }

              if (swiperContainer) {
                swiperContainer.style.marginInlineStart = '0';
              }

              if (previousIndex > activeIndex) {
                isArrivedLastSlide = false;
                swiperContainer.style.marginInlineStart = '0';
              }
            }
          },
          transitionEnd: swiper => {
            const isSwiperGenerated =
              swiper.slides.length > 1 ? true : false;

            if (isSwiperGenerated) {
              let slideIndex = swiper.activeIndex;

              const swiperCardWidth = swiper.slides[0].offsetWidth;

              slideIndex = Math.abs(
                Math.floor(swiper.translate / [swiperCardWidth])
              );

              const activeSlide = Array.from(swiper.slides).find(
                sliderSlide =>
                  sliderSlide.classList.contains(
                    'swiper-slide-active'
                  )
              );

              // play or pause videos in active and next slides
              const activeSlideVideo =
                activeSlide.querySelector('video');
              const nextSlideVideo =
                activeSlide.nextElementSibling?.querySelector(
                  'video'
                );

              const playVideo = video => {
                if (video && video.paused) {
                  this.playPromise(video);
                } else if (video) {
                  video.pause();
                }
              };

              playVideo(activeSlideVideo);
              playVideo(nextSlideVideo);

              const activeSlideYoutube =
                activeSlide.querySelector('.js-youtube');
              if (activeSlideYoutube) {
                this.playYoutubeVideo(activeSlideYoutube);
              }

              const activeSlideVimeo =
                activeSlide.querySelector('.js-vimeo');
              if (activeSlideVimeo) {
                this.playVimeoVideo(activeSlideVimeo);
              }
            }
          }
        }
      }
    };

    if (withThumbs === 'true') {
      const thumbSettings = {
        swiper: {
          el: '.swiper-thumbs',

          initialSlide: this.selectedMediaIndex,

          centeredSlides: false,
          centeredSlidesBounds: false,
          // slideToClickedSlide: true,
          freeMode: {
            enabled: true,
            sticky: true
          },
          direction: 'horizontal',

          slidesPerView: 'auto',
          spaceBetween: 0,

          threshold: 5,

          watchOverflow: !isSingleSlide,
          watchSlidesVisibility: true,
          watchSlidesProgress: true,

          breakpoints: {
            750: {
              direction: swiperOptions.thumbsDirectionDesktop,
              spaceBetween: 0,
              slidesPerView: 'auto'
            }
          },

          on: {
            touchEnd: function (s, e) {
              let range = 5;
              let diff = (s.touches.diff = s.isHorizontal()
                ? s.touches.currentX - s.touches.startX
                : s.touches.currentY - s.touches.startY);
              if (diff < range || diff > -range) s.allowClick = true;
            },
            afterInit: () => {
              this.querySelector('.swiper-thumbs').removeAttribute('style');
            }
          }
        }
      };

      this.settings.options.thumbs = thumbSettings;

      const slides = this.querySelectorAll('.swiper-slide');
      const slideCount = slides.length;
      if (slideCount === 1) {
        this.settings.options.breakpoints = {
          750: {
            direction: swiperOptions.directionDesktop || swiperOptions.direction || 'horizontal'
          },
          1000: {
            slidesPerView: 0.6,
            direction: swiperOptions.directionDesktop || swiperOptions.direction || 'horizontal'
          }
        };
      } else {
        this.settings.options.breakpoints = {
          750: {
            direction: swiperOptions.directionDesktop || swiperOptions.direction || 'horizontal',
            slidesPerView: swiperOptions.slidesPerViewDesktop || 1
          },
          1000: {
            slidesPerView: swiperOptions.slidesPerViewDesktop || 1,
            direction: swiperOptions.directionDesktop || swiperOptions.direction || 'horizontal'
          },
          1350: {
            slidesPerView: swiperOptions.slidesPerViewDesktop || 1,
            direction: swiperOptions.directionDesktop || swiperOptions.direction || 'horizontal'
          },
          1920: {
            slidesPerView: swiperOptions.slidesPerViewDesktop || 1,
            direction: swiperOptions.directionDesktop || swiperOptions.direction || 'horizontal'
          }
        };
      }

      // Add the thumbs-specific event handlers
      this.settings.options.on.init = swiper => {
        setTimeout(() => {
          swiper.thumbs.swiper.el.classList.add(
            'swiper-thumbs--visible'
          );
        }, 10);
      };

      this.settings.options.on.slideChangeTransitionStart =
        swiper => {
          const thumbsSwiper = swiper.thumbs.swiper;
          const activeIndex = swiper.activeIndex;
          const thumbsActiveIndex = thumbsSwiper.activeIndex;
          if (activeIndex !== thumbsActiveIndex) {
            thumbsSwiper.slideTo(activeIndex);
          }
        };
    } else {
      const slides = this.querySelectorAll('.swiper-slide');
      const slideCount = slides.length;
      if (slideCount === 1) {
        this.settings.options.slidesPerView = swiperOptions.slidesPerView || 1;
        this.settings.options.breakpoints = {
          750: {
            direction: swiperOptions.directionDesktop || swiperOptions.direction || 'horizontal',
            slidesPerView: swiperOptions.slidesPerViewDesktop || 0.6
          },
          1000: {
            slidesPerView: swiperOptions.slidesPerViewDesktop || 0.6,
            direction: swiperOptions.directionDesktop || swiperOptions.direction || 'horizontal'
          }
        };
      } else {
        this.settings.options.slidesPerView = swiperOptions.slidesPerView || 1;
        this.settings.options.breakpoints = {
          750: {
            direction: swiperOptions.directionDesktop || swiperOptions.direction || 'horizontal',
            slidesPerView: swiperOptions.slidesPerViewDesktop || 1
          },
          1000: {
            slidesPerView: swiperOptions.slidesPerViewDesktop || 1,
            direction: swiperOptions.directionDesktop || swiperOptions.direction || 'horizontal'
          },
          1350: {
            slidesPerView: swiperOptions.slidesPerViewDesktop || 1.3,
            direction: swiperOptions.directionDesktop || swiperOptions.direction || 'horizontal'
          },
          1920: {
            slidesPerView: swiperOptions.slidesPerViewDesktop || 1.7,
            direction: swiperOptions.directionDesktop || swiperOptions.direction || 'horizontal'
          }
        };
      }
    }
  }

  playPromise(video) {
    let playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Automatic playback started!
          // Show playing UI.
          // video.play();
        })
        .catch(error => {
          // Auto-play was prevented
          // Show paused UI.
          video.pause();
        });
    }
  }

  playYoutubeVideo(element) {
    element.contentWindow.postMessage(
      '{"event":"command","func":"' + 'playVideo' + '","args":""}',
      '*'
    );
  }

  playVimeoVideo(element) {
    element.contentWindow.postMessage('{"method":"play"}', '*');
  }

  connectedCallback() {
    this.init();
  }

  init() {
    const [
      zoomContainerWidth,
      zoomContainerHeight,
      closeIcon,
      prevIcon,
      nextIcon
    ] = [
      this.offsetWidth,
      this.offsetHeight,
      this.querySelector('[data-close-icon]'),
      this.querySelector('[data-prev-icon]'),
      this.querySelector('[data-next-icon]')
    ];

    function isPhone() {
      return window.innerWidth < 750;
    }

    const photoSwipeLightboxInstance = new PhotoSwipeLightbox({
      gallery: `#${this.settings.sliderElement.id}`,
      // appendToEl: this.querySelector(this.selectors.zoomContainer),
      children: 'a',
      mainClass: 'pswp--product-media-gallery',

      loop: false,
      showHideAnimationType: 'zoom',

      initialZoomLevel: zoomLevelObject => {
        if (isPhone()) {
          return zoomLevelObject.vFill;
        } else {
          return zoomLevelObject.fit;
        }
      },
      secondaryZoomLevel: zoomLevelObject => {
        if (isPhone()) {
          return zoomLevelObject.fit;
        } else {
          return 1;
        }
      },
      pswpModule: PhotoSwipe
    });
    photoSwipeLightboxInstance.addFilter(
      'uiElement',
      (element, data) => {
        if (data.name === 'close') {
          element.innerHTML = closeIcon.innerHTML;
        } else if (data.name === 'arrowPrev') {
          element.innerHTML = prevIcon.innerHTML;
        } else if (data.name === 'arrowNext') {
          element.innerHTML = nextIcon.innerHTML;
        }
        return element;
      }
    );

    // html for video
    photoSwipeLightboxInstance.addFilter(
      'itemData',
      (itemData, index) => {
        if (itemData.type === 'html' && itemData.element) {
          return {
            html: itemData.element.dataset.pswpHtml
          };
        }
        return itemData;
      }
    );

    photoSwipeLightboxInstance.init();
    this.lightbox = photoSwipeLightboxInstance;

    photoSwipeLightboxInstance.on('beforeOpen', () => {
      const videos = this.querySelectorAll('video');
      Array.from(videos).forEach(video => {
        // if video is not playing, call playPromise
        // force to play
        video.play().then(() => {
            // Automatic playback started!
            // Show playing UI.
            // video.play();
          }).catch(error => {
            // Auto-play was prevented
            // Show paused UI.
            video.pause();
          });

      });
    });

    this.addEventListener('dragstart', event => {
      event.preventDefault();
    });

    if (!this.settings.sliderElement) return;

    this.settings.sliderInstance = new Swiper(
      this.settings.sliderElement,
      this.settings.options
    );

    this.settings.sliderInstance.on('click', (swiper, event) => {
      if (
        event.target.closest(
          '.swiper-button, .product__media-arrows, .product__model-info, .product__media-sale-badge'
        )
      ) {
        return;
      }

      if (this.lightbox) {
        this.lightbox.loadAndOpen(swiper.activeIndex);
      }
    });
  }

  setActiveMedia(id) {
    const mediaFound = Array.from(
      this.querySelectorAll(this.selectors.mediaItem)
    ).find(media => Number(media.dataset.mediaId) === id);
    if (!mediaFound) return;
    this.settings.sliderInstance.slideTo(
      Number(mediaFound.dataset.index)
    );
  }

  setActiveModalOpener(swiper) {
    const activeSlide = swiper.slides.filter(sliderSlide =>
      sliderSlide.classList.contains('swiper-slide-active')
    )[0];
    if (!activeSlide) return;
    const activeMediaId = activeSlide.dataset.mediaId;
    this.querySelector(
      `${this.selectors.modalOpeners}.is-active`
    )?.classList.remove('is-active');
    this.querySelector(
      `${this.selectors.modalOpeners} [data-media-id="${activeMediaId}"]`
    )?.parentElement.classList.add('is-active');
    const isModel = activeSlide.dataset.mediaType === 'model';
    if (!isModel) return;
    const btnXr = this.querySelector(this.selectors.btnXr);
    btnXr.dataset.shopifyModel3dId = activeMediaId;
  }
}

customElements.define('product-media', ProductMedia);
}
