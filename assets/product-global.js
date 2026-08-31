const productContent = document.getElementsByClassName(
  'product__content'
)[0];
const sprStarRating =
  document.getElementsByClassName('spr-starrating')[0];

if (!productContent && !sprStarRating) {
  if (productContent.classList.contains('text-center')) {
    sprStarRating.style.justifyContent = 'center';
  } else if (productContent.classList.contains('text-right')) {
    sprStarRating.style.justifyContent = 'flex-end';
  } else if (productContent.classList.contains('text-left')) {
    sprStarRating.style.justifyContent = 'flex-start';
  }
}

if (!customElements.get('product-sticky-atc')) {
  customElements.define(
    'product-sticky-atc',
    class ProductStickyAtc extends HTMLElement {
      constructor() {
        super();
      }

      connectedCallback() {
        const originalSubmit = document.querySelector('.product-selector__submit');
        if (!originalSubmit) return;

        const stickySubmit = this.querySelector('.product-selector__submit');
        if (!stickySubmit) return;

        const productGallery = document.querySelector('.product__media');

        let isSubmitVisible = false;
        let isGalleryVisible = false;

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach(entry => {
              if (entry.target === originalSubmit) isSubmitVisible = entry.isIntersecting;
              if (entry.target === productGallery) isGalleryVisible = entry.isIntersecting;
            });

            stickySubmit.style.display = (isSubmitVisible || isGalleryVisible) ? 'none' : '';
          },
          { threshold: 0.01 }
        );

        observer.observe(originalSubmit);
        if (productGallery) observer.observe(productGallery);
      }
    }
  );
}
