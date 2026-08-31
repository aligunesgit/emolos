(() => {
  if (customElements.get('compare-slider')) {
    return;
  }

  class CompareSlider extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      const sectionId = this.dataset.id;

      if (!sectionId) return;

      this.inputSelector = this.querySelector('input[type="range"]');

      if (!this.inputSelector) return;

      this.inputSelector.addEventListener('input', () => {
        this.slideBeforeAfter(sectionId);
      });

      this.slideBeforeAfter(sectionId);

      if (Shopify.designMode) {
        document.addEventListener('shopify:section:load', (event) => {
          const loadedSection = event.detail.sectionId;

          if (`section-compare-slider-${sectionId}` !== loadedSection) return;

          const input = document.querySelector(
            `#section-compare-slider-${sectionId} input[type="range"]`
          );

          if (!input) return;

          input.addEventListener('input', () => {
            this.slideBeforeAfter(sectionId);
          });
        });

        document.addEventListener('change', (e) => {
          if (e.target.closest(`#section-compare-slider-${sectionId}`) && e.target.matches('input[type="range"]')) {
            this.slideBeforeAfter(sectionId);
          }
        });
      }
    }

    slideBeforeAfter(sectionId) {
      const isRTL = document.documentElement.getAttribute('dir') === 'rtl';

      const section = document.querySelector(`#section-compare-slider-${sectionId}`);
      if (!section) return;

      const input = section.querySelector('input[type="range"]');
      const handleValue = section.querySelector('.ims-slider .ims-handle-line');
      const imageBefore = section.querySelector('.ims-image-before');
      const imageAfter = section.querySelector('.ims-image-after');

      if (!input || !handleValue || !imageBefore || !imageAfter) return;

      let slideValue = input.value;

      if (!isRTL) {
        imageBefore.style.clipPath = `polygon(${slideValue}% 0, 100% 0, 100% 100%, ${slideValue}% 100%)`;
        imageAfter.style.clipPath = `polygon(0 0, ${slideValue}% 0, ${slideValue}% 100%, 0 100%)`;
      } else {
        const rtlSlideValue = 100 - slideValue;

        imageBefore.style.clipPath = `polygon(0 0, ${rtlSlideValue}% 0, ${rtlSlideValue}% 100%, 0 100%)`;
        imageAfter.style.clipPath = `polygon(${rtlSlideValue}% 0, 100% 0, 100% 100%, ${rtlSlideValue}% 100%)`;
      }

      handleValue.style.cssText = `inset-inline-start: ${slideValue}%;`;
    }
  }

  customElements.define('compare-slider', CompareSlider);
})();
