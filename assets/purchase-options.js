class PurchaseOptions extends HTMLElement {
  constructor() {
    super();
    this.selectors = {
      product: '[data-main-product]',
      sellingPlanGroups: '[data-selling-plan-group-selector]',
      sellingPlans: '[data-selling-plan-selector]',
      sellingPlansWrapper: '[data-selling-plans-wrapper]'
    };

    this.productSelector = this.closest(
      this.selectors.product
    ).querySelector('product-selector');
    this.productForm = this.closest(
      this.selectors.product
    ).querySelector('product-form');
  }

  connectedCallback() {
    this.setHandlers();
  }

  setHandlers() {
    this.querySelector(
      this.selectors.sellingPlanGroups
    ).addEventListener(
      'change',
      this.onSellingGroupChange.bind(this)
    );
    this.querySelectorAll(this.selectors.sellingPlans).forEach(
      sellingPlanSelector =>
        sellingPlanSelector.addEventListener('change', event => {
          event.target
            .closest('dropdown-input')
            ?.classList?.remove('has-error');
          this.updateProductSelector(event.target.value);
        })
    );
  }

  onSellingGroupChange(event) {
    if (event.target.value == 'one-time') {
      Array.from(
        this.querySelectorAll(this.selectors.sellingPlans)
      ).map(select => {
        select.value = '';
      });
      this.updateProductSelector();

      const sellingPlansWrapper = this.querySelector(
        this.selectors.sellingPlansWrapper
      );
      sellingPlansWrapper.style.maxHeight = '0';
      sellingPlansWrapper.classList.add('is-hidden');
      return;
    }

    const sellingPlansWrapperId = event.target.querySelector(
      `option[value="${event.target.value}"]`
    ).dataset.id;

    const sellingPlansWrapper = this.querySelector(
      this.selectors.sellingPlansWrapper
    );
    sellingPlansWrapper
      .querySelectorAll(`[data-id]`)
      .forEach(sellingGroupWrapper => {
        sellingGroupWrapper.classList.toggle(
          'is-hidden',
          sellingGroupWrapper.dataset.id !== sellingPlansWrapperId
        );
      });
    sellingPlansWrapper.style.maxHeight = `${sellingPlansWrapper.scrollHeight}px`;
    sellingPlansWrapper.classList.remove('is-hidden');
  }

  isOneTimePurchase() {
    return (
      this.querySelector('[name="selling_plan_group"]').value ===
      'one-time'
    );
  }

  showError() {
    const sellingPlanWrappers = this.querySelectorAll(
      this.selectors.sellingPlansWrapper
    );
    const activeSellingPlanWrapper = [...sellingPlanWrappers].filter(
      sellingPlanWrapper =>
        !sellingPlanWrapper.classList.contains('is-hidden')
    )[0];
    activeSellingPlanWrapper
      .querySelectorAll('dropdown-input')
      .forEach(dropdownInput =>
        dropdownInput.classList.add('has-error')
      );
  }

  updateProductSelector(sellingPlanId) {
    if (!this.productSelector.currentVariant) {
      this.productSelector.updateVariant();
    }

    this.productSelector.updateURL(sellingPlanId);
    this.productSelector.renderProductInfo();
    if (
      this.productSelector.currentVariant.available &&
      sellingPlanId
    ) {
      this.productForm.setAttribute('data-has-selling-plan', 'true');
      this.productForm.toggleAddButton(false, '');
      return;
    }

    this.productForm.removeAttribute('data-has-selling-plan', true);
    this.productForm.toggleAddButton(false, '');
  }
}

customElements.define('purchase-options', PurchaseOptions);
