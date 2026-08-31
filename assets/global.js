/* Sahara Theme - v3.0.2 */
const body = document.querySelector('body');

let header = document.querySelector(
  '#header, #shopify-section-main-password-header header'
);
let headerGroup = document.querySelector(
  '.shopify-section-group-header-group'
);
let announcementBar = headerGroup?.querySelector(
  '.js-announcement-bar'
);

let productMedia = document.querySelector('.product__media'); // on pdp
let productMediaSwiper = document.querySelector(
  '.product__media .swiper'
); // on pdp

const windowDynamicEvents = ['scroll', 'resize'];

/* DEVICE DETECTOR -- START */
const DeviceDetector = {
  getUserAgent() {
    return navigator.userAgent.toLowerCase();
  },
  isMobile() {
    const ua = this.getUserAgent();
    const mobileRegex = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i;
    return mobileRegex.test(ua) || window.innerWidth <= 750;
  },
  isTablet() {
    const ua = this.getUserAgent();
    const tabletRegex = /ipad|android(?!.*mobile)|tablet|kindle|playbook|silk/i;
    return tabletRegex.test(ua) || (window.innerWidth > 750 && window.innerWidth <= 990 && 'ontouchstart' in window);
  },
  isDesktop() {
    return !this.isMobile() && !this.isTablet();
  },
  isIOS() {
    const ua = this.getUserAgent();
    const iosRegex = /iphone|ipad|ipod/i;
    return iosRegex.test(ua);
  },
};
/* DEVICE DETECTOR -- END */

// add loading lazy attribute to div.hero__inner > div.media > video > img
document
  .querySelectorAll('.hero__inner > .media > video > img')
  .forEach(function (el) {
    el.setAttribute('loading', 'lazy');
    el.setAttribute('alt', 'Video Cover');
  });

// catch all images with class 'lazyload' and add loading lazy attribute
document.querySelectorAll('.lazyload').forEach(function (el) {
  el.setAttribute('loading', 'lazy');
});

windowDynamicEvents.forEach(eventType => {
  window.addEventListener(eventType, () => {
    setRootCustomProperties();
  });
});

setRootCustomProperties();

window.addEventListener('shopify:section:load', function () {
  header = document.querySelector(
    '#header, #shopify-section-main-password-header header'
  );
  announcementBar = document.querySelector('.js-announcement-bar');
});

function setCustomProperty(property, value) {
  document.documentElement.style.setProperty(property, value);
}

function setRootCustomProperties() {
  const setCustomProperty = (property, value) => {
    document.documentElement.style.setProperty(property, value);
  };

  // viewport height
  setCustomProperty('--viewport-height', `${window.innerHeight}px`);

  // header height
  const updateHeaderHeight = () => {
    const header = document.querySelector('header');
    if (header) {
      setCustomProperty(
        '--header-height',
        `${parseInt(header.offsetHeight)}px`
      );
    } else {
      setCustomProperty('--header-height', `0px`);
    }
  };

  // Section body width
  const updateSectionBodyWidth = () => {
    const sectionBody = document.querySelector(
      'section > .container > .section__body'
    );
    if (sectionBody) {
      setCustomProperty(
        '--section-body-width',
        `${parseInt(sectionBody.offsetWidth)}px`
      );
    }
  };

  updateHeaderHeight();
  updateSectionBodyWidth();

  window.addEventListener('resize', () => {
    updateHeaderHeight();
    updateSectionBodyWidth();
  });

  if (window.Shopify && window.Shopify.designMode) {
    document.addEventListener('shopify:section:load', () => {
      updateHeaderHeight();
      updateSectionBodyWidth();
    });

    document.addEventListener('shopify:section:unload', () => {
      updateHeaderHeight();
      updateSectionBodyWidth();
    });

    document.addEventListener('shopify:section:select', () => {
      updateHeaderHeight();
      updateSectionBodyWidth();
    });

    document.addEventListener('shopify:section:deselect', () => {
      updateHeaderHeight();
      updateSectionBodyWidth();
    });

    document.addEventListener('shopify:block:select', () => {
      updateHeaderHeight();
      updateSectionBodyWidth();
    });

    document.addEventListener('shopify:block:deselect', () => {
      updateHeaderHeight();
      updateSectionBodyWidth();
    });
  }

  // announcement bar top
  if (announcementBar) {
    let announcementBarTop = Math.max(
      0,
      announcementBar.getBoundingClientRect().y +
        announcementBar.offsetHeight
    );
    setCustomProperty(
      '--announcement-bar-top',
      `${parseInt(announcementBarTop)}px`
    );
    setCustomProperty(
      '--announcement-bar-height',
      `${parseInt(announcementBar.offsetHeight)}px`
    );
  } else {
    setCustomProperty('--announcement-bar-top', `0px`);
    setCustomProperty('--announcement-bar-height', `0px`);
  }

  // product media width
  if (productMedia && productMedia.offsetWidth != 0) {
    setCustomProperty(
      '--product-media-area-width',
      `${parseInt(productMedia.offsetWidth)}px`
    );
    setCustomProperty(
      '--product-media-area-swiper-height',
      `${parseInt(productMediaSwiper.offsetHeight)}px`
    );

    const mediaInProductMedia =
      productMedia.querySelector('.media > *');
    if (mediaInProductMedia) {
      setCustomProperty(
        '--product-media-width',
        `${parseInt(mediaInProductMedia.offsetWidth)}px`
      );
    }
  }

  // transparent header menu color
  let heroBanner = document.querySelector('.hero-banner');
  if (heroBanner) {
    let heroInner = heroBanner.querySelectorAll('.hero__inner');
    if (heroInner.length > 0) {
      let heroInnerFirst = heroInner[0];
      let headerMenuTextColor = heroInnerFirst.getAttribute(
        'data-header-menu-text-color'
      );
      if (headerMenuTextColor) {
        setCustomProperty(
          '--transparent-header-menu-text-color',
          `${headerMenuTextColor}`
        );
      }
    }
  }
}

// scroll-position
function scrollPositionY() {
  setCustomProperty('--window-scroll-y-position', window.scrollY);

  const sectionHeader = document.querySelector('.section-header');

  // fix: window.scrollY is not always 0 when at top -- check this shifting issue
  if (window.scrollY < 5) {
    window.scrollTo(0, 0);
  }

  if (window.scrollY === 0) {
    document.body.classList.add('is-at-top');
    document.body.classList.remove('is-scrolled');

    // if header has data-sticky-header attribute is true, remove is-sticky class from header
    if (
      sectionHeader &&
      header &&
      header.getAttribute('data-sticky-header') === 'true'
    ) {
      sectionHeader.classList.remove('is-sticky');
    }
  } else {
    document.body.classList.add('is-scrolled');
    document.body.classList.remove('is-at-top');

    // if header has data-sticky-header attribute is true, add is-sticky class to header
    if (
      sectionHeader &&
      header &&
      header.getAttribute('data-sticky-header') === 'true'
    ) {
      sectionHeader.classList.add('is-sticky');
    }
  }
}
window.addEventListener('scroll', scrollPositionY);

const isHeaderSticky = header?.classList.contains('is-sticky');

// if announcement bar exists and is coming after from header
const isAnnouncementBarAfterHeader =
  announcementBar?.parentElement?.previousElementSibling?.classList.contains(
    'section-header'
  );

const onKeyUpEscape = event => {
  if (event.code.toUpperCase() !== 'ESCAPE') return;

  const openDetailsElement = event.target.closest('details[open]');
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector('summary');
  openDetailsElement.removeAttribute('open');
  summaryElement.setAttribute('aria-expanded', false);
  summaryElement.focus({
    preventScroll: true
  });
};

const getFocusableElements = container => {
  return Array.from(
    container.querySelectorAll(
      'summary, a[href], button:enabled, [tabindex]:not([tabindex^="-"]), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe'
    )
  );
};

document
  .querySelectorAll('[id^="Details-"] summary')
  .forEach(summary => {
    summary.setAttribute('role', 'button');
    summary.setAttribute(
      'aria-expanded',
      summary.parentNode.hasAttribute('open')
    );

    if (summary.nextElementSibling.getAttribute('id')) {
      summary.setAttribute(
        'aria-controls',
        summary.nextElementSibling.id
      );
    }

    summary.addEventListener('click', event => {
      event.currentTarget.setAttribute(
        'aria-expanded',
        !event.currentTarget.closest('details').hasAttribute('open')
      );
    });

    if (summary.closest('header-drawer')) return;
    summary.parentElement.addEventListener('keyup', onKeyUpEscape);
  });

const trapFocusHandlers = {};

const removeTrapFocus = (elementToFocus = null) => {
  document.removeEventListener('focusin', trapFocusHandlers.focusin);
  document.removeEventListener(
    'focusout',
    trapFocusHandlers.focusout
  );
  document.removeEventListener('keydown', trapFocusHandlers.keydown);

  if (elementToFocus)
    elementToFocus.focus({
      preventScroll: true
    });
};

const trapFocus = (container, elementToFocus = container) => {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = event => {
    if (
      event.target !== container &&
      event.target !== last &&
      event.target !== first
    )
      return;

    document.addEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function () {
    document.removeEventListener(
      'keydown',
      trapFocusHandlers.keydown
    );
  };

  trapFocusHandlers.keydown = function (event) {
    if (event.code.toUpperCase() !== 'TAB') return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if (
      (event.target === container || event.target === first) &&
      event.shiftKey
    ) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener('focusout', trapFocusHandlers.focusout);
  document.addEventListener('focusin', trapFocusHandlers.focusin);

  elementToFocus.focus();
};

const serializeForm = form => {
  const obj = {};
  const formData = new FormData(form);
  for (const key of formData.keys()) {
    obj[key] = formData.get(key);
  }
  return JSON.stringify(obj);
};

const deepClone = obj => {
  return JSON.parse(JSON.stringify(obj));
};

const handleize = str => str.replace(/[ /_]/g, '-').toLowerCase();

const decode = str => decodeURIComponent(str).replace(/\+/g, ' ');

const getOffsetTop = element => {
  let offsetTop = 0;

  do {
    if (!isNaN(element.offsetTop)) {
      offsetTop += element.offsetTop;
    }
  } while ((element = element.offsetParent));

  return offsetTop;
};

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.details = this.querySelector('details');
    this.summary = this.querySelector('summary');
    this.drawer = this.querySelector('.js-drawer');
    this.btnsCloseDrawer = this.querySelectorAll(
      '.js-btn-close-drawer'
    );
    this.btnsCloseDrawer = [...this.btnsCloseDrawer].filter(
      btnCloseDrawer =>
        this.drawer === btnCloseDrawer.closest('.js-drawer')
    );
    this.elementToFocus =
      this.querySelector('.js-drawer-focus-element') ||
      this.btnsCloseDrawer[0];
    this.toggleButtons = [this.summary, ...this.btnsCloseDrawer];
    this.isParentDrawerOpen = false;
    this.predictiveSearch = this.querySelector('predictive-search');

    this.setInitialAccessibilityAttr();

    this.toggleButtons.forEach(toggleButton => {
      toggleButton.addEventListener('click', e => {
        e.preventDefault();

        this.toggleDrawer();
      });
    });

    this.addEventListener('keydown', e => {
      const isEscapeKey = e.key === 'Escape';
      const isDrawerOpen =
        this.details.classList.contains('menu-opening');
      const nestedOpenDrawer =
        this.details.querySelector('details[open]');

      if (!isEscapeKey || nestedOpenDrawer || !isDrawerOpen) {
        return;
      }

      if (
        this.predictiveSearch &&
        this.predictiveSearch.input == document.activeElement
      ) {
        return;
      }

      this.toggleDrawer();
    });

    this.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const activeElement = document.activeElement;

        if (
          activeElement &&
          activeElement.matches('input[type="checkbox"]')
        ) {
          activeElement.click();
          e.preventDefault();
        }
      }
    });

    this.toggleTrapFocus();
  }

  toggleDrawer() {
    const isDrawerTransitioning = this.details.classList.contains(
      'drawer-transitioning'
    );

    // const isDetailsOpen = this.details.classList.contains('menu-opening');

    const isDetailsOpen = this.details.hasAttribute('open');

    if (!isDetailsOpen) {
      this.details.setAttribute('open', '');
      this.toggleButtons.forEach(toggleButton => {
        toggleButton.classList.add('menu-is-open');
        toggleButton.setAttribute('aria-expanded', true);
      });
      this.details.classList.add('menu-opening');

      const bodyHasOverflow = body.style.overflow === 'hidden';
      if (bodyHasOverflow) {
        this.parentDrawer = this.closest('.js-drawer');
        if (!this.parentDrawer) {
          this.isParentDrawerOpen = false;
        }
        this.isParentDrawerOpen = true;

        if (this.isParentDrawerOpen && this.parentDrawer) {
          this.parentDrawer.style.overflow = 'hidden';
        }
      } else {
        let scrollPosition = window.scrollY;
        body.style.overflow = 'hidden';
        scrollPosition = window.scrollY;
        // body.style.position = 'fixed';
        body.style.top = `-${scrollPosition}px`;
        body.style.width = '100%';
      }
    } else {
      this.details.classList.remove('menu-opening');
      this.toggleButtons.forEach(toggleButton => {
        toggleButton.classList.remove('menu-is-open');
        toggleButton.setAttribute('aria-expanded', false);
      });
      if (!this.isParentDrawerOpen) {
        body.style.overflow = '';
        body.style.position = '';
      }
      if (this.isParentDrawerOpen && this.parentDrawer) {
        this.parentDrawer.style.overflow = '';
      }

      /** removing this attr witout timeout causes transition issues */
      setTimeout(() => {
        this.details.removeAttribute('open');
      }, 500);
    }

    const handleDropdownTransition = e => {
      if (
        e.target !== this.drawer ||
        e.propertyName !== 'visibility'
      ) {
        return;
      }

      this.details.classList.remove('drawer-transitioning');

      if (this.elementToFocus) {
        this.elementToFocus.focus({
          preventScroll: true
        });
      }

      const isDetailsOpen = this.details.hasAttribute('open');

      if (!isDetailsOpen) {
        this.toggleButtons.forEach(toggleButton => {
          toggleButton.setAttribute('aria-expanded', false);
        });
        this.summary.focus({
          preventScroll: true
        });
      }

      if (this.isParentDrawerOpen) {
        this.parentDrawer.style.overflow = '';
        document.body.style.overflow = '';
      } else {
        document.body.style.overflow = 'hidden';
      }

      e.target.removeEventListener(
        'transitionend',
        handleDropdownTransition
      );
    };

    this.drawer.addEventListener(
      'transitionstart',
      e => {
        this.details.classList.add('drawer-transitioning');
      },
      {
        once: true
      }
    );

    this.drawer.addEventListener(
      'transitionend',
      handleDropdownTransition
    );
  }

  instantlyHideDrawer() {
    this.toggleButtons.forEach(toggleButton => {
      toggleButton.setAttribute('aria-expanded', false);
    });
    this.details.classList.remove('menu-opening');
    this.details.removeAttribute('open');
    body.style.overflow = '';
  }

  toggleTrapFocus(container = this.drawer) {
    document.addEventListener('focusin', e => {
      const isDrawerOpen =
        this.details.classList.contains('menu-opening');

      if (!isDrawerOpen) {
        return;
      }

      const openDrawer = e.target.closest(
        'details.menu-opening .js-drawer'
      );
      const nestedOpenDrawer = this.details.querySelector(
        'details.menu-opening'
      );

      if (openDrawer === this.drawer || nestedOpenDrawer) {
        return;
      }

      e.preventDefault();

      const focusableElements = getFocusableElements(container);
      const focusedElementDOMPosition =
        container.compareDocumentPosition(e.target);

      const visibleFocusableElements = focusableElements.filter(
        focusableElement => {
          const isHidden =
            getComputedStyle(focusableElement).display === 'none';

          if (isHidden) {
            return;
          }

          const isSummary = focusableElement.tagName === 'SUMMARY';
          const focusableElementDetails =
            focusableElement.closest('details');
          const parentFocusableElementDetails =
            focusableElementDetails.parentElement.closest('details');
          const focusableElementDrawer =
            focusableElementDetails.querySelector('.js-drawer');
          const isThisDrawerOrDetails = focusableElementDrawer
            ? focusableElementDrawer === this.drawer
            : focusableElementDetails === this.details;

          return (
            isThisDrawerOrDetails ||
            (isSummary &&
              parentFocusableElementDetails.hasAttribute('open'))
          );
        }
      );

      const firstFocusableElement = visibleFocusableElements[0];
      const lastFocusableElement =
        visibleFocusableElements[visibleFocusableElements.length - 1];

      if (focusedElementDOMPosition >= 4) {
        firstFocusableElement.focus({
          preventScroll: true
        });

        return;
      }

      lastFocusableElement.focus({
        preventScroll: true
      });
    });
  }

  setInitialAccessibilityAttr() {
    const isDetailsOpen = this.details.hasAttribute('open');

    this.summary.setAttribute('role', 'button');
    this.summary.setAttribute('aria-controls', this.drawer.id);
    this.summary.setAttribute('aria-expanded', isDetailsOpen);
  }
}

customElements.define('menu-drawer', MenuDrawer);

class HeaderDrawer extends MenuDrawer {
  constructor() {
    super();

    this._previousWidth = window.innerWidth;

    window.addEventListener('resize', e => {
      const currentWidth = window.innerWidth;
      const widthChanged = this._previousWidth !== currentWidth;
      this._previousWidth = currentWidth;

      if (!widthChanged) {
        return;
      }

      const isMobileDrawer = this.classList.contains('mobile-drawer');

      if (isMobileDrawer) {
        return;
      }

      const isMenuOpen = this.details.classList.contains('menu-opening');
      if (DeviceDetector.isDesktop() || !isMenuOpen) {
        return;
      }

      this.isToggling = false;

      this.instantlyHideDrawer();
    });
  }

  instantlyHideDrawer() {
    super.instantlyHideDrawer();
  }

  toggleDrawer() {
    if (this.isToggling) return;
    this.isToggling = true;

    const isDrawerTransitioning = this.details.classList.contains(
      'drawer-transitioning'
    );

    const drawerButton = this.querySelector('.drawer__button');
    // if drawerButton has .menu-is-open class and if header has .menu-open class, drawer is open
    // so when drawerButton with .menu-is-open class is clicked, remove .menu-open class from header
    if (drawerButton.classList.contains('menu-is-open')) {
      header.classList.remove('menu-open');
      drawerButton.classList.remove('menu-is-open');
    } else {
      header.classList.add('menu-open');
      drawerButton.classList.add('menu-is-open');
    }

    // header.classList.toggle('menu-open');
    super.toggleDrawer();

    setTimeout(() => {
      this.isToggling = false;
    }, 400);
  }

  toggleTrapFocus() {
    super.toggleTrapFocus(this.details);
  }
}

customElements.define('header-drawer', HeaderDrawer);

class DesktopDrawer extends MenuDrawer {
  constructor() {
    super();

    window.addEventListener('resize', e => {
      const isMenuOpen = this.details.classList.contains('menu-opening');
      if (!DeviceDetector.isDesktop() || !isMenuOpen) {
        return;
      }
      this.instantlyHideDrawer();
    });
  }
}

customElements.define('desktop-drawer', DesktopDrawer);

function pauseAllMedia() {
  document.querySelectorAll('.js-youtube').forEach(video => {
    video.contentWindow.postMessage(
      '{"event":"command","func":"' + 'pauseVideo' + '","args":""}',
      '*'
    );
  });
  document.querySelectorAll('.js-vimeo').forEach(video => {
    video.contentWindow.postMessage('{"method":"pause"}', '*');
  });
  document.querySelectorAll('video').forEach(video => video.pause());
  document.querySelectorAll('product-model').forEach(model => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

// unpause all media
function unpauseAllMedia() {
  document.querySelectorAll('.js-youtube').forEach(video => {
    video.contentWindow.postMessage(
      '{"event":"command","func":"' + 'playVideo' + '","args":""}',
      '*'
    );
  });
  document.querySelectorAll('.js-vimeo').forEach(video => {
    video.contentWindow.postMessage('{"method":"play"}', '*');
  });
  // document.querySelectorAll('video').forEach(video => video.play());

  document.querySelectorAll('video').forEach(video => {
    let playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(_ => {
          // Automatic playback started!
          // Show playing UI.
          // video.play();
        })
        .catch(error => {
          // Auto-play was prevented
          // Show paused UI.
          // if paused, play
          video.play();
        });
    } else {
      // Show paused UI.
    }
  });

  document.querySelectorAll('product-model').forEach(model => {
    if (model.modelViewerUI) model.modelViewerUI.play();
  });
}

const debounce = (fn, wait) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
};

const fetchConfig = (type = 'json') => {
  return {
    method: 'POST',
    headers: {
      'Content-Type': `application/${type}`,
      'Accept': `application/${type}`
    }
  };
};

class QuantityInput extends HTMLElement {
  constructor() {
    super();

    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true });

    this.decrementButton = this.querySelector('button[name="decrement"]');
    this.incrementButton = this.querySelector('button[name="increment"]');

    this.updateButtonColors();

    this.querySelectorAll('button').forEach(button =>
      button.addEventListener('click', this.onButtonClick.bind(this))
    );
    this.input.addEventListener('input', this.updateButtonColors.bind(this));

    this.input.addEventListener('blur', this.validateInput.bind(this));
  }

  validateInput() {
    const allowZero = this.hasAttribute('data-allow-zero');
    const min = allowZero ? 0 : (parseInt(this.input.min, 10) || 1);
    const max = parseInt(this.input.max, 10) || Infinity;
    let value = parseInt(this.input.value, 10);

    if (isNaN(value) || value < min) {
      this.input.value = min;
    } else if (value > max) {
      this.input.value = max;
    }

    this.updateButtonColors();
  }

  updateButtonColors() {
    const value = parseInt(this.input.value, 10);
    const allowZero = this.hasAttribute('data-allow-zero');
    const min = allowZero ? 0 : (parseInt(this.input.min, 10) || 1);
    const max = parseInt(this.input.max, 10) || Infinity;

    this.decrementButton.querySelectorAll('path').forEach(path => {
      path.setAttribute(
        'stroke',
        value <= min ? '#c2c9d6' : 'rgb(var(--color-heading-text))'
      );
    });

    this.incrementButton.querySelectorAll('path').forEach(path => {
      path.setAttribute(
        'stroke',
        value >= max ? '#c2c9d6' : 'rgb(var(--color-heading-text))'
      );
    });
  }

  onButtonClick(event) {
    event.preventDefault();

    const previousValue = this.input.value;

    event.target.name === 'increment'
      ? this.input.stepUp()
      : this.input.stepDown();

    const allowZero = this.hasAttribute('data-allow-zero');
    const min = allowZero ? 0 : (parseInt(this.input.min, 10) || 1);
    if (parseInt(this.input.value, 10) < min) {
      this.input.value = min;
    }

    if (previousValue !== this.input.value)
      this.input.dispatchEvent(this.changeEvent);
      this.updateButtonColors();
  }
}

customElements.define('quantity-input', QuantityInput);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector('button');

    if (!button) return;

    button.addEventListener('click', () => {
      const modal = document.querySelector(
        this.getAttribute('data-modal')
      );

      if (modal) modal.show(button);
    });
  }
}
customElements.define('modal-opener', ModalOpener);

class ModalDialog extends HTMLElement {
  constructor() {
    super();

    this.dialogHolder = this.querySelector('[role="dialog"]');
    const closeButton = this.querySelector('[id^="ModalClose-"]');
    if (closeButton) {
      closeButton.addEventListener('click', this.hide.bind(this, false));
    }
    this.addEventListener('keyup', event => {
      if (event.code?.toUpperCase() === 'ESCAPE') this.hide();
    });
    this.addEventListener('click', event => {
      if (event.target === this) this.hide();
    });
  }

  connectedCallback() {
    if (this.moved) return;
    this.moved = true;
    document.body.appendChild(this);
  }

  show(opener) {
    this.openedBy = opener;
    document.body.classList.add('overflow-hidden');
    this.setAttribute('open', '');
    trapFocus(this, this.dialogHolder);
    window.pauseAllMedia();
  }

  hide() {
    document.body.classList.remove('overflow-hidden');
    document.body.dispatchEvent(new CustomEvent('modalClosed'));
    this.removeAttribute('open');
    removeTrapFocus(this.openedBy);
    window.unpauseAllMedia();
  }
}
customElements.define('modal-dialog', ModalDialog);

function isIOS() {
  const userAgent = navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(userAgent) || (userAgent.includes('Mac') && navigator.maxTouchPoints > 1);
}
class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!poster) return;
    poster.addEventListener('click', this.loadContent.bind(this));
  }

  loadContent(focus = true) {
    if (!this.getAttribute('loaded')) {
      const content = document.createElement('div');
      content.appendChild(
        this.querySelector(
          'template'
        ).content.firstElementChild.cloneNode(true)
      );

      this.setAttribute('loaded', true);
      const deferredElement = this.appendChild(
        content.querySelector('video, model-viewer, iframe')
      );

      if (isIOS()) {
        deferredElement.controls = true;
      }

      deferredElement.play && deferredElement.play();

      if (focus) deferredElement.focus();
    }
  }
}

customElements.define('deferred-media', DeferredMedia);

/**
 * Additions
 */


class ThemeDropdown extends HTMLElement {
  constructor() {
    super();
    this.button = this.querySelector('.dropdown-button');
    this.content = this.querySelector('.dropdown-content');
    this.hiddenInput = this.querySelector('input[type="hidden"]');

    this.toggle = this.toggle.bind(this);
    this.handleItemClick = this.handleItemClick.bind(this);
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
    this.handleEscapeKey = this.handleEscapeKey.bind(this);
  }

  connectedCallback() {
    this.button?.addEventListener('click', this.toggle);
    this.content?.addEventListener('click', this.handleItemClick);
    document.addEventListener('click', this.handleOutsideClick);
    document.addEventListener('keydown', this.handleEscapeKey);
  }

  disconnectedCallback() {
    this.button?.removeEventListener('click', this.toggle);
    this.content?.removeEventListener('click', this.handleItemClick);
    document.removeEventListener('click', this.handleOutsideClick);
    document.removeEventListener('keydown', this.handleEscapeKey);
  }

  toggle(e) {
    e.stopPropagation();

    if (!this.hasAttribute('open')) {
      document
        .querySelectorAll('theme-dropdown[open]')
        .forEach(dropdown => {
          if (dropdown !== this) dropdown.removeAttribute('open');
        });
    }
    this.toggleAttribute('open');
  }

  handleItemClick(e) {
    const link = e.target.closest('a[data-value]');
    if (!link) return;

    e.preventDefault();
    const value = link.dataset.value;
    const text = link.textContent.trim();
    if (this.hiddenInput) {
      this.hiddenInput.value = value;
      this.hiddenInput.dispatchEvent(
        new Event('input', { bubbles: true })
      );
    }

    const buttonText = this.button.querySelector(
      '.dropdown-button__text-content'
    );
    if (buttonText) buttonText.textContent = text;

    this.querySelectorAll('li').forEach(li =>
      li.classList.remove('is-active')
    );
    link.closest('li')?.classList.add('is-active');
    this.removeAttribute('open');
  }

  handleOutsideClick(e) {
    if (this.hasAttribute('open') && !this.contains(e.target)) {
      this.removeAttribute('open');
    }
  }

  handleEscapeKey(e) {
    if (e.key === 'Escape' && this.hasAttribute('open')) {
      this.removeAttribute('open');
    }
  }
}
customElements.define('theme-dropdown', ThemeDropdown);

class LocalizationForm extends HTMLElement {
  constructor() {
    super();

    this.form = this.querySelector('form');
    this.localizationInputElements = this.querySelectorAll(
      '[name="country_code"], [name="language_code"]'
    );

    this.localizationInputElements.forEach(inputElement => {
      inputElement.addEventListener('input', () => {
        this.form.submit();
      });
    });
  }
}
customElements.define('localization-form', LocalizationForm);

class AccordionDefault extends HTMLElement {
  constructor() {
    super();

    this.hideMultiple = this.hasAttribute('data-hide-multiple');
    this.summaryElements = this.querySelectorAll('summary');

    this.setInitialAccessibilityAttr();

    this.addEventListener('click', e => {
      let isBtn =
        e.target.classList.contains('accordion__button') ||
        e.target.closest('svg');
      const svgElement = e.target.closest('svg');

      if (!isBtn) {
        isBtn = e.target.classList.contains('js-btn');
      }

      if (svgElement) {
        const summary = svgElement.closest('summary');

        if (summary) {
          summary.click();
        }
      }

      if (!isBtn) {
        return;
      }

      e.preventDefault();

      const targetBtn =
        e.target.closest('summary') ||
        e.target.closest('svg').closest('summary');

      this.toggleDropdown(targetBtn);
      this.collapseInactiveItems(targetBtn);
    });

    this.addEventListener('keydown', e => {
      const isEscapeKey = e.key === 'Escape';

      if (!isEscapeKey) {
        return;
      }

      const closestOpenDetails = document.activeElement.closest(
        'details.is-active'
      );

      if (!closestOpenDetails) {
        return;
      }

      const btn = closestOpenDetails.querySelector('summary');

      this.toggleDropdown(btn);
      this.collapseInactiveItems(btn);
    });
    if (Shopify.designMode) {
      let timeoutId;
      document
        .querySelectorAll('.drawer__submenu-first-item')
        .forEach(item => {
          item.addEventListener('click', function () {
            if (item.classList.contains('is-active')) {
              if (timeoutId) {
                clearTimeout(timeoutId);
              }
              item.classList.remove('is-active');
            } else {
              item.classList.add('is-active');
              timeoutId = setTimeout(() => {
                item.classList.remove('is-active');
              }, 10000);
            }
          });
        });
    }
  }

  collapseInactiveItems(exceptBtn) {
    if (!this.hideMultiple) return;
    const allSummaryElements = document.querySelectorAll(
      'accordion-default summary'
    );
    allSummaryElements.forEach(summary => {
      const accordionDefault = summary.closest('accordion-default');
      if (summary !== exceptBtn) {
        accordionDefault.toggleDropdown(summary, true);
      }
    });
  }

  toggleDropdown(btn, forceClose) {
    const dropdown = btn.nextElementSibling;
    const isDropdownTransitioning = dropdown.classList.contains(
      'is-transitioning'
    );

    if (isDropdownTransitioning) {
      return;
    }

    const details = btn.parentElement;

    if (forceClose) {
      dropdown.style.height = `${dropdown.scrollHeight}px`;
      requestAnimationFrame(() => {
        dropdown.style.height = '0px';
      });
      details.classList.remove('is-active');
      details.removeAttribute('open');
      btn.setAttribute('aria-expanded', false);
      return;
    }

    details.classList.toggle('is-active');

    const isDetailsActive = details.classList.contains('is-active');
    btn.setAttribute('aria-expanded', isDetailsActive);

    if (isDetailsActive) {
      details.setAttribute('open', '');

      dropdown.style.height = `${dropdown.scrollHeight}px`;
    } else {
      dropdown.style.height = `${dropdown.scrollHeight}px`;

      requestAnimationFrame(() => {
        dropdown.style.height = '0px';
      });
    }

    dropdown.classList.add('is-transitioning');
    dropdown.addEventListener(
      'transitionend',
      handleHeightTransition
    );

    function handleHeightTransition(e) {
      dropdown.removeEventListener(
        'transitionend',
        handleHeightTransition
      );
      dropdown.classList.remove('is-transitioning');

      if (details.classList.contains('is-active')) {
        dropdown.style.height = 'auto';
      } else {
        details.removeAttribute('open');
        btn.focus();
      }
    }
  }

  setInitialAccessibilityAttr() {
    this.summaryElements.forEach(summaryElement => {
      const detailsElement = summaryElement.parentElement;
      const dropdown = summaryElement.nextElementSibling;
      const isDetailsOpen = detailsElement.hasAttribute('open');

      summaryElement.setAttribute('role', 'button');
      summaryElement.setAttribute('aria-controls', dropdown.id);
      summaryElement.setAttribute('aria-expanded', isDetailsOpen);
    });
  }
}

customElements.define('accordion-default', AccordionDefault);

const nav = document.querySelector('.js-nav');

nav?.addEventListener('click', function (e) {
  const isHoverDisabled = matchMedia('(hover: none)').matches;
  const isLink = e.target.classList.contains('js-nav-link');

  if (!isHoverDisabled || !isLink) {
    return;
  }

  const link = e.target;
  const linkItem = link.parentElement;
  const linksList = linkItem.parentElement;
  const activeLinkItem = linksList.querySelector(
    '.js-nav-item.is-active'
  );
  const hasDropdown = linkItem.classList.contains('has-dropdown');

  if (activeLinkItem !== linkItem) {
    activeLinkItem?.classList.remove('is-active');
  }

  if (!hasDropdown) {
    return;
  }

  e.preventDefault();

  linkItem.classList.toggle('is-active');
});

document.addEventListener('click', function (e) {
  const targetActiveLinkItem = e.target.closest(
    '.js-nav-item.is-active'
  );

  if (targetActiveLinkItem) {
    return;
  }

  const activeLinkItems = document.querySelectorAll(
    '.js-nav-item.is-active'
  );

  if (activeLinkItems.length == 0) {
    return;
  }

  activeLinkItems.forEach(activeLinkItem => {
    activeLinkItem.classList.remove('is-active');
  });
});

let navItems = document.querySelectorAll(
  '.js-nav-item.has-dropdown:not(.default-dropdown)'
);

window.addEventListener('shopify:section:load', function () {
  navItems = document.querySelectorAll(
    '.js-nav-item.has-dropdown:not(.default-dropdown)'
  );
});

['DOMContentLoaded', 'resize'].forEach(eventType => {
  window.addEventListener(eventType, () => {
    navItems = document.querySelectorAll(
      '.js-nav-item.has-dropdown:not(.default-dropdown)'
    );
    navItems.forEach(navItem => {
      const dropdown = navItem.querySelector('.js-dropdown');

      if (!dropdown) {
        return;
      }

      const { y, height } = navItem.getBoundingClientRect();
      const itemTop = y + height;
      const dropdownY = dropdown.getBoundingClientRect().y;
      const isSameOffset = itemTop === dropdownY;

      if (isSameOffset) {
        return;
      }

      const difference = Math.round(dropdownY - itemTop);

      navItem.style.setProperty('--after-height', `${difference}px`);
    });
  });
});

// Add is scrolled class for header when transparent and sticky are enabled

let hero =
  document.querySelector('.hero-banner') ||
  document.querySelector('main section');

window.addEventListener('shopify:section:load', function () {
  hero =
    document.querySelector('.hero-banner') ||
    document.querySelector('main section');
});

toggleHeaderIsScrolled();

windowDynamicEvents.forEach(eventType => {
  window.addEventListener(eventType, function () {
    toggleHeaderIsScrolled();
  });
});

window.addEventListener('scroll', function () {
  if (announcementBar) {
    let announcementBarTop = Math.max(
      0,
      announcementBar.getBoundingClientRect().y +
        announcementBar.offsetHeight
    );
    document.documentElement.style.setProperty(
      '--announcement-bar-top',
      `${parseInt(announcementBarTop)}px`
    );
  }
});

window.addEventListener('load', function () {
  if (announcementBar) {
    let announcementBarTop = Math.max(
      0,
      announcementBar.getBoundingClientRect().y +
        announcementBar.offsetHeight
    );
    document.documentElement.style.setProperty(
      '--announcement-bar-top',
      `${parseInt(announcementBarTop)}px`
    );
  }
});

function toggleHeaderIsScrolled() {
  if (!header || !hero) return;

  if (announcementBar && !isElementInViewport(announcementBar)) {
    document.documentElement.style.setProperty(
      '--announcement-bar-top',
      `0px`
    );
  }

  const isHeaderSticky = header.classList.contains('is-sticky');
  const isTransparentOnScroll = header.classList.contains(
    'is-transparent-on-scroll'
  );

  if (!isHeaderSticky) {
    return;
  }

  const { height, y } = hero.getBoundingClientRect();
  const isHeroInViewport = y + height - header.clientHeight > 0;

  if (isHeroInViewport) {
    header.classList.remove('is-scrolled');
    header.classList.remove('is-transparent-on-scroll');
  } else {
    if (isTransparentOnScroll) {
      header.classList.remove('is-scrolled');
      header.classList.add('is-transparent-on-scroll');
    } else {
      header.classList.add('is-scrolled');
    }
  }
}

function isElementInViewport(element) {
  var rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <=
      (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Animations

const animationObserverOptions = {
  rootMargin: '-100px'
};

const animationObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) {
      return;
    }

    entry.target.classList.add('animation-init');
    entry.target.addEventListener(
      'animationend',
      () => {
        entry.target.classList.add('animation-none');
      },
      {
        once: true
      }
    );
    animationObserver.unobserve(entry.target);
  });
}, animationObserverOptions);

observeAnimationElements();

window.addEventListener('shopify:section:load', () => {
  observeAnimationElements();
});

function observeAnimationElements() {
  const animationElements = document.querySelectorAll(
    '[class*="js-animation-"]'
  );

  animationElements.forEach(animationElement => {
    animationObserver.observe(animationElement);
  });
}

// DropdownInput

class DropdownInput extends HTMLElement {
  constructor() {
    super();
    this.select = this.querySelector('select');
    this.dropdown = null;
    this.buttons = null;
    this.detailsTemplate = this.querySelector(
      'template[data-name="details"]'
    );
    this.optionTemplate = this.querySelector(
      'template[data-name="option"]'
    );
    if (!this.select) return;
  }

  connectedCallback() {
    this.init();

    document.addEventListener('click', event => {
      const isClickInside = this.contains(event.target);
      if (!isClickInside) {
        this.dropdown.removeAttribute('open');
        this.dropdown.classList.remove('is-open');
      }
    });
  }

  init() {
    this.select.classList.add('hidden');
    this.appendTemplate();
  }

  appendTemplate() {
    const detailsTemplate =
      this.detailsTemplate.content.firstElementChild.cloneNode(true);
    const optionTemplate = this.optionTemplate.content;
    const options = Array.from(this.select.options);
    if (options.length === 0) return;
    const selectedOption = options.find(option => option.selected);
    detailsTemplate.querySelector('[data-label]').textContent =
      selectedOption.label;
    options.forEach(option => {
      const html = optionTemplate.cloneNode(true);
      const button = html.querySelector('button');
      const li = html.querySelector('li');
      button.toggleAttribute('disabled', option.disabled);

      button.setAttribute('data-value', option.value);
      button.textContent = option.label;
      li.classList.toggle('is-active', option.selected);
      detailsTemplate.querySelector('[data-options]').append(html);
    });

    this.append(detailsTemplate);
    this.dropdown = this.querySelector('details');
    this.buttons = this.dropdown.querySelectorAll('button');
    this.setHandlers();
  }

  update() {
    this.dropdown = null;
    this.buttons = null;
    this.querySelector('details')?.remove();
    this.appendTemplate();
  }

  setHandlers() {
    this.querySelector('summary').addEventListener(
      'click',
      this.onSummaryClick.bind(this)
    );
    this.buttons.forEach((button, index) => {
      button.addEventListener('click', event =>
        this.onOptionSelect(event, index)
      );
    });
  }

  onOptionSelect(event, index) {
    event.preventDefault();
    Array.from(this.select.options).forEach(option =>
      option.removeAttribute('selected')
    );

    this.select.options[index].setAttribute('selected', 'selected');
    this.select.value = event.target.dataset.value;
    this.select.dispatchEvent(new Event('change', { bubbles: true }));
    this.querySelector('[data-label]').textContent =
      this.select.options[index].label;

    this.setSelectedOption(event.target);

    // when option is selected, update the dropdown
    this.update();
  }

  setSelectedOption(buttonOption) {
    const buttonEl = buttonOption;
    this.buttons.forEach(button => {
      button.parentElement.classList.remove('is-active');
    });
    buttonEl.parentElement.classList.add('is-active');
    this.select.dispatchEvent(new Event('change'));
    this.select.closest('form')?.dispatchEvent(new Event('input'));
    this.close(
      undefined,
      this.dropdown.querySelector('summary'),
      this.dropdown
    );
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const isOpen = detailsElement.hasAttribute('open');

    isOpen
      ? this.close(event, summaryElement, detailsElement)
      : this.open(summaryElement, detailsElement);
  }

  open(summaryElement, detailsElement) {
    setTimeout(() => {
      detailsElement.classList.add('is-open');
    });
    summaryElement.setAttribute('aria-expanded', true);
    trapFocus(detailsElement, summaryElement);
  }

  close(event, summaryElement, detailsElement) {
    if (event) {
      event.preventDefault();
    }

    detailsElement.classList.remove('is-open');
    removeTrapFocus(summaryElement);
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = time => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      elapsedTime < 300 // Increase for animation duration if necessary
        ? window.requestAnimationFrame(handleAnimation)
        : detailsElement.removeAttribute('open');
    };

    window.requestAnimationFrame(handleAnimation);
  }
}
customElements.define('dropdown-input', DropdownInput);

if (!customElements.get('text-truncator')) {
  class TextTruncator extends HTMLElement {
    constructor() {
      super();
      this.initElements();
    }

    connectedCallback() {
      this.setupTextTruncation();
      // Uncomment the following line to enable resizing functionality
      // window.addEventListener('resize', this.setupTextTruncation.bind(this));
    }

    initElements() {
      this.textTruncatorButton = this.querySelector(
        '.text-truncator__button'
      );
      this.textTruncatorButtonText =
        this.textTruncatorButton?.querySelector(
          '.text-truncator__button-text'
        );
      this.textTruncatorIconPlus =
        this.textTruncatorButton?.querySelector('.icon-plus');
      this.textTruncatorIconMinus =
        this.textTruncatorButton?.querySelector('.icon-minus');
    }

    setupTextTruncation() {
      const textTruncator = this.querySelector('.text-truncator');
      textTruncator.style.display = 'block'; // show the block initially

      const { lineHeight, lineCount, maxLineCount } =
        this.calculateLineCounts(textTruncator);

      if (lineCount > maxLineCount) {
        this.applyTextTruncation(
          textTruncator,
          lineHeight,
          maxLineCount
        );
        this.setupButton(textTruncator);
      } else {
        this.removeTextTruncation(textTruncator);
      }
    }

    calculateLineCounts(element) {
      const lineHeight = parseFloat(
        window.getComputedStyle(element).lineHeight
      );
      const lineCount = Math.floor(element.clientHeight / lineHeight);
      const maxLineCount = parseInt(this.dataset.maxLineCount);

      return { lineHeight, lineCount, maxLineCount };
    }

    applyTextTruncation(element, lineHeight, maxLineCount) {
      element.classList.add('text-truncator--hidden');

      const maxHeight = `${lineHeight * maxLineCount}px`;
      const style = document.createElement('style');
      style.innerHTML = `.text-truncator--hidden { max-height: ${maxHeight}; }`;
      document.head.appendChild(style);
    }

    removeTextTruncation(element) {
      element.classList.remove('text-truncator--hidden');

      if (this.textTruncatorButton) {
        this.textTruncatorButton.innerHTML = '';
      }
    }

    setupButton(textTruncator) {
      if (this.textTruncatorButton) {
        this.textTruncatorButtonText.innerHTML = `<span>${this.dataset.readMore}</span>`;
        this.toggleIcons('plus');
        this.textTruncatorButton.addEventListener('click', event => {
          event.preventDefault();
          this.toggleTextTruncation(textTruncator);
        });
      }
    }

    toggleTextTruncation(textTruncator) {
      const paragraphs = textTruncator.querySelectorAll('p');
      const isHidden = textTruncator.classList.contains(
        'text-truncator--hidden'
      );

      paragraphs.forEach((paragraph, index) => {
        paragraph.style.marginTop =
          isHidden && index !== 0 ? '1rem' : '';
      });

      textTruncator.classList.toggle('text-truncator--hidden');
      this.textTruncatorButtonText.innerHTML = `<span>${
        isHidden ? this.dataset.readLess : this.dataset.readMore
      }</span>`;
      this.toggleIcons(isHidden ? 'minus' : 'plus');

      // on mobile, if the text is expanded, set max-height to 4rem
      if (isHidden && window.innerWidth < 768) {
        const lineHeight = parseFloat(
          window.getComputedStyle(textTruncator).lineHeight
        );
        textTruncator.style.overflow = 'scroll';
      } else {
        textTruncator.style.maxHeight = '';
        textTruncator.style.overflow = '';
      }
    }

    toggleIcons(iconType) {
      this.textTruncatorIconPlus.style.display =
        iconType === 'plus' ? 'inline-block' : 'none';
      this.textTruncatorIconMinus.style.display =
        iconType === 'minus' ? 'inline-block' : 'none';
    }
  }
  customElements.define('text-truncator', TextTruncator);
}

const megaMenu = document.querySelector('nav.js-nav');
if (megaMenu) {
  function toggleMegamenuOpen() {
    const hasVisibleDropdown = megaMenu.querySelector(
      '.js-dropdown.is-visible'
    );
    if (hasVisibleDropdown) {
      header.classList.add('is-megamenu-open');
    } else {
      header.classList.remove('is-megamenu-open');
    }
  }

  megaMenu.querySelectorAll('.js-nav-item').forEach(item => {
    const menuContent = item.querySelector('.js-dropdown');
    const link = item.querySelector('.js-nav-link');

    link.addEventListener('mouseenter', () => {
      const menuItem = item.getAttribute('data-menu-item');
      if (menuItem === null) {
        return; // if menu item is not defined, return
      }
      closeAllDropdowns();
      if (menuContent) {
        menuContent.classList.add('is-visible');
      }
      toggleMegamenuOpen();
    });

    item.addEventListener('mouseleave', e => {
      const related = e.relatedTarget;
      if (
        related &&
        (menuContent?.contains(related) ||
          item.contains(related) ||
          megaMenu.contains(related))
      ) {
        return; // if mouse is still in the menu, keep the dropdown open
      }
      toggleMegamenuOpen();
    });

    if (menuContent) {
      menuContent.addEventListener('mouseleave', e => {
        const related = e.relatedTarget;
        if (
          related &&
          (menuContent.contains(related) ||
            item.contains(related) ||
            megaMenu.contains(related))
        ) {
          return; // if mouse is still in the menu, keep the dropdown open
        }
        closeAllDropdowns();
        toggleMegamenuOpen();
      });
    }
  });
  megaMenu.addEventListener('mouseleave', () => {
    closeAllDropdowns();
    toggleMegamenuOpen();
  });

  function closeAllDropdowns() {
    megaMenu
      .querySelectorAll('.js-dropdown.is-visible')
      .forEach(dropdown => {
        const item = dropdown.closest('.js-nav-item');
        const menuItem = item?.getAttribute('data-menu-item');
        if (!menuItem) {
          return;
        }
        dropdown.classList.remove('is-visible');
      });
  }
}

class BackToTop extends HTMLElement {
  constructor() {
    super();
    this.vertical_offset_for_trigger = window.innerHeight * 0.5;
    this.addEventListener('click', this.scrollToTop.bind(this));
  }

  scrollToTop() {
    window.scroll({
      top: 0,
      behavior: 'smooth'
    });
  }

  connectedCallback() {
    window.addEventListener('scroll', () => this.handleScroll(), {
      passive: true
    });
  }

  handleScroll() {
    const top = window.pageYOffset;
    if (top > this.vertical_offset_for_trigger) {
      this.classList.remove('hide');
    } else {
      this.classList.add('hide');
    }
  }
}

customElements.define('back-to-top', BackToTop);

const submenuButtons = document.querySelectorAll(
  '.drawer__submenu-btn'
);

submenuButtons.forEach(button => {
  button.addEventListener('click', function () {
    const parentDiv = button.parentElement;
    const isActive = parentDiv.classList.contains('is-active');

    // Etkin öğeyi doğrula
    const submenuSecond = parentDiv.querySelector(
      '.drawer__submenu-second'
    );
    if (submenuSecond) {
      submenuSecond.style.height = isActive ? '0px' : 'auto';
    }

    const submenuItems = document.querySelectorAll(
      '.drawer__submenu-first-item'
    );
    submenuItems.forEach(item => {
      item.classList.remove('is-active');
      const submenu = item.querySelector('.drawer__submenu-second');
      if (submenu) {
        submenu.style.height = '0px';
      }
    });

    if (!isActive) {
      parentDiv.classList.add('is-active');
      const submenuSec = parentDiv.querySelector(
        '.drawer__submenu-second'
      );
      if (submenuSec) {
        submenuSec.style.height = 'auto';
      }
    }
  });
});

// Countdown Timer
class CountdownTimer extends HTMLElement {
  constructor() {
    super();

    const timezone = this.dataset.timezone,
      date = this.dataset.date.split('-'),
      day = parseInt(date[0]),
      month = parseInt(date[1]),
      year = parseInt(date[2]);

    let time = this.dataset.time,
      tarhour,
      tarmin;

    if (time != null) {
      time = time.split(':');
      tarhour = parseInt(time[0]);
      tarmin = parseInt(time[1]);
    }

    // Set the date we're counting down to
    let date_string =
      month +
      '/' +
      day +
      '/' +
      year +
      ' ' +
      tarhour +
      ':' +
      tarmin +
      ' GMT' +
      timezone;
    // Time without timezone
    this.countDownDate = new Date(
      year,
      month - 1,
      day,
      tarhour,
      tarmin,
      0,
      0
    ).getTime();

    // Time with timezone
    this.countDownDate = new Date(date_string).getTime();
  }

  convertDateForIos(date) {
    var arr = date.split(/[- :]/);
    date = new Date(
      arr[0],
      arr[1] - 1,
      arr[2],
      arr[3],
      arr[4],
      arr[5]
    );
    return date;
  }
  connectedCallback() {
    let _this = this;

    const updateTime = function () {
      // Get todays date and time
      const now = new Date().getTime();

      // Find the distance between now an the count down date
      const distance = _this.countDownDate - now;

      // Time calculations for days, hours, minutes and seconds
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor(
        (distance % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      let countdownTimerColumns = _this.querySelector(
        '.countdown-timer__columns'
      );
      let countdownTimerMessage = _this.querySelector(
        '.countdown-timer__message'
      );

      // set .countdown-timer__column-number blocks
      let daysBlock = _this.querySelector(
        '.days .countdown-timer__column-number'
      );
      let hoursBlock = _this.querySelector(
        '.hours .countdown-timer__column-number'
      );
      let minutesBlock = _this.querySelector(
        '.minutes .countdown-timer__column-number'
      );
      let secondsBlock = _this.querySelector(
        '.seconds .countdown-timer__column-number'
      );

      if (distance < 0) {
        if (_this.dataset.endMessage === 'true') {
          // if the countdown is over, show the message and hide the countdown
          if (countdownTimerColumns)
            countdownTimerColumns.classList.add('hidden');
          if (countdownTimerMessage)
            countdownTimerMessage.classList.remove('hidden');
        } else {
          if (daysBlock) daysBlock.innerHTML = 0;
          if (hoursBlock) hoursBlock.innerHTML = 0;
          if (minutesBlock) minutesBlock.innerHTML = 0;
          if (secondsBlock) secondsBlock.innerHTML = 0;
        }

        _this.classList.add('loading-effect');

        // update data-is-ended attribute
        _this.setAttribute('data-is-ended', 'true');
      } else {
        requestAnimationFrame(updateTime);

        if (daysBlock)
          daysBlock.innerHTML = CountdownTimer.addZero(days);
        if (hoursBlock)
          hoursBlock.innerHTML = CountdownTimer.addZero(hours);
        if (minutesBlock)
          minutesBlock.innerHTML = CountdownTimer.addZero(minutes);
        if (secondsBlock)
          secondsBlock.innerHTML = CountdownTimer.addZero(seconds);

        // if days is 0, remove the days block
        if (days === 0) {
          if (daysBlock)
            daysBlock.parentElement.parentElement.remove();
        }

        _this.classList.remove('loading-effect');
      }
    };
    requestAnimationFrame(updateTime);
  }
  static addZero(x) {
    return x < 10 && x >= 0 ? '0' + x : x;
  }
}
customElements.define('countdown-timer', CountdownTimer);

async function updateFreeShipping() {
  const conversionRate = Shopify.currency.rate;
  const {
    cart_free_shipping_text: freeShippingTextDefault,
    cart_free_shipping_text_success: freeShippingTextSuccessDefault,
    cart_free_shipping_threshold: freeShippingThreshold,
    money_with_currency_format: moneyFormat
  } = window.theme.settings;

  const freeShippingElements =
    document.querySelectorAll('shipping-bar');

  try {
    const response = await fetch('/cart.js');
    const { total_price, item_count } = await response.json();

    const visibility = item_count == 0 ? 'hidden' : 'visible';
    freeShippingElements.forEach(
      el => (el.style.visibility = visibility)
    );

    const newShippingThreshold = Math.round(
      freeShippingThreshold * conversionRate
    );
    const newRemainingAmount = newShippingThreshold - total_price;

    freeShippingElements.forEach(freeShipping => {
      const freeShippingTextElement = freeShipping.querySelector(
        '.progress-bar__text'
      );
      const progressBarInner = freeShipping.querySelector(
        '[data-progress-line]'
      );
      if (total_price >= newShippingThreshold) {
        freeShippingTextElement.innerHTML =
          freeShippingTextSuccessDefault;
        progressBarInner.style.width = '100%';
      } else {
        const moneyMatch = freeShippingTextDefault.match(
          /<span class="money">(.*)<\/span>/
        );
        if (moneyMatch) {
          const newFreeShippingText = freeShippingTextDefault.replace(
            moneyMatch[1],
            `${formatPrice(moneyFormat, newRemainingAmount / 100)}`
          );
          freeShippingTextElement.innerHTML = newFreeShippingText;
        }
        progressBarInner.style.width = `calc(${
          (total_price / newShippingThreshold) * 100
        }% + 2px)`;
      }
    });
  } catch (error) {
    console.error('Error fetching cart data:', error);
  }
}

function formatPrice(moneyString, amount) {
  // convert amount to 00.00 format
  amount = amount.toFixed(2);

  const money_format = /{{(.*?)}}/;

  let money_format_option = '';
  if (moneyString.match(money_format)) {
    money_format_option = moneyString.match(money_format)[1];
  } else {
    console.error('No match found');
  }

  let newValue = '';
  switch (money_format_option) {
    case 'amount':
      newValue = moneyString.replace(money_format, amount);
      break;
    case 'amount_with_comma_separator':
      newValue = moneyString.replace(
        money_format,
        amount.toString().replace('.', ',')
      );
      break;
    case 'amount_no_decimals':
      newValue = moneyString.replace(
        money_format,
        Math.round(amount)
      );
      break;
    case 'amount_no_decimals_with_comma_separator':
      newValue = moneyString.replace(
        money_format,
        Intl.NumberFormat(Shopify.country)
          .format(Math.round(amount))
          .toString()
          .replace('.', ',')
      );
      break;
    default:
      newValue = moneyString.replace(money_format, amount);
      break;
  }

  return newValue;
}

class SwiperComponent extends HTMLElement {
  constructor() {
    super();
    this.swiperOptions =
      JSON.parse(this.getAttribute('data-swiper-options')) || {};
    this.swiperInitialized = false; // Prevent multiple initializations
  }

  connectedCallback() {
    // Use a proper load event depending on the environment
    if (Shopify.designMode) {
      window.addEventListener('shopify:section:load', () =>
        this.init()
      );
      window.addEventListener('shopify:section:select', () =>
        this.init()
      );

      // fallback initialization after delay in design mode
      setTimeout(() => {
        if (!this.swiperInitialized) this.init();
      }, 100);
    } else {
      window.addEventListener('load', () => this.init());
    }
  }

  init() {
    // Prevent multiple initializations
    if (this.swiperInitialized) return;
    this.swiperInitialized = true;

    const swiperOptions = this.swiperOptions;

    const option = {
      slideshowId: swiperOptions.swiperId || '',
      slideCount: swiperOptions.slideCount || 1,
      slidesPerView: swiperOptions.slidesPerView || 'auto',
      slidesPerViewDesktop:
        swiperOptions.slidesPerViewDesktop ||
        swiperOptions.slidesPerView ||
        4,
      slidesPerViewTablet:
        swiperOptions.slidesPerViewTablet ||
        swiperOptions.slidesPerViewDesktop ||
        swiperOptions.slidesPerView ||
        3,
      spaceBetween: swiperOptions.spaceBetweenMobile || 0,
      spaceBetweenDesktop:
        swiperOptions.spaceBetweenDesktop ||
        swiperOptions.spaceBetween ||
        0,
      spaceBetweenTablet:
        swiperOptions.spaceBetweenTablet ||
        swiperOptions.spaceBetweenDesktop ||
        swiperOptions.spaceBetweenMobile ||
        0
    };

    this.swiperOptions = {
      a11y: false,
      allowTouchMove: option.slideCount > 1 ? true : false,
      loop: swiperOptions.loop || false,
      rewind: swiperOptions.rewind || false,
      followFinger: swiperOptions.followFinger || false,
      slidesPerView: option.slidesPerView,
      spaceBetween: option.spaceBetween,
      breakpoints: {
        750: {
          allowTouchMove:
            option.slideCount > option.slidesPerViewTablet
              ? true
              : false,
          slidesPerView: option.slidesPerViewTablet,
          spaceBetween: option.spaceBetweenTablet
        },
        990: {
          allowTouchMove:
            option.slideCount > option.slidesPerViewDesktop
              ? true
              : false,
          slidesPerView: option.slidesPerViewDesktop,
          spaceBetween: option.spaceBetweenDesktop
        }
      }
    };

    if (swiperOptions.navigation) {
      this.swiperOptions.navigation = {
        ...swiperOptions.navigation
      };
    }

    if (swiperOptions.effect == 'fade') {
      this.swiperOptions.effect = 'fade';
      this.swiperOptions.fadeEffect = {
        crossFade: true
      };
    }

    if (swiperOptions.pagination == 'custom_bullet') {
      this.swiperOptions.pagination = {
        el: swiperOptions.paginationElement,
        clickable: true,
        renderBullet: function (i, className) {
          return `
          <button class="${className}">
            <span></span>
          </button>
          `;
        }
      };
    } else {
      this.swiperOptions.pagination = {
        el: '.swiper-pagination',
        clickable: true
      };
    }

    if (swiperOptions.autoplay) {
      this.swiperOptions.autoplay = {
        ...swiperOptions.autoplay
      };

      if (swiperOptions.autoplayProgress) {
        const progressCircle = this.querySelector(
          `.autoplay-progress--${swiperOptions.swiperId} svg`
        );
        const progressContent = this.querySelector(
          `.autoplay-progress--${swiperOptions.swiperId} span`
        );

        this.swiperOptions.on = {
          autoplayTimeLeft(s, time, progress) {
            progressCircle.style.setProperty(
              '--progress',
              1 - progress
            );
            progressContent.textContent = `${Math.ceil(time / 1000)}`;
          }
        };
      }
    }

    this.swiper = new Swiper(this, this.swiperOptions);
  }
}
customElements.define('swiper-component', SwiperComponent);

/* constants */
const PUB_SUB_EVENTS = {
  cartUpdate: 'cart-update',
  quantityUpdate: 'quantity-update',
  variantChange: 'variant-change',
  cartError: 'cart-error'
};
