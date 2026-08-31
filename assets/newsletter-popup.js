class NewsletterPopup extends ModalDialog {
  constructor() {
    super();
    this.delay = this.dataset.delay * 1000;
    this.closed = getCookie('newsletter-closed');
    this.subscribed = getCookie('newsletter-subscribed');
    this.form = this.querySelector('.js-form');
    this.ageVerificationPopup = document.querySelector(
      'age-verification-popup'
    );

    if (!!this.form) {
      this.form.addEventListener(
        'submit',
        this.onSubscribe.bind(this)
      );
    }
  }

  connectedCallback() {
    if (Shopify.designMode) {
      if (this.dataset.openInDesignMode === 'true') {
        this.show();
      }
      return;
    }

    if (this.ageVerificationPopup) {
      let prevClassState = this.classList.contains(
        'newsletter-popup-is-hidden'
      );

      var newsletterPopup = this;

      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (mutation.attributeName == 'class') {
            var currentClassState =
              mutation.target.classList.contains(
                'newsletter-popup-is-hidden'
              );
            if (prevClassState !== currentClassState) {
              prevClassState = currentClassState;
              if (!currentClassState) {
                setTimeout(() => {
                  if (
                    newsletterPopup.closed !== null ||
                    newsletterPopup.subscribed !== null
                  )
                    return;
                  newsletterPopup.show();
                }, newsletterPopup.delay);
              }
            }
          }
        });
      });
      observer.observe(this, { attributes: true });
    } else {
      setTimeout(() => {
        if (this.closed !== null || this.subscribed !== null) return;
        this.show();
      }, this.delay);
    }
  }

  hide() {
    super.hide();
    setCookie('newsletter-closed', 'true');
  }

  onSubscribe() {
    setCookie('newsletter-subscribed', 'true');
    this.hide();
  }
}

customElements.define('newsletter-popup', NewsletterPopup);
