class FacetFiltersForm extends HTMLElement {
  constructor() {
    super();

    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);
    this.debouncedOnSubmit = debounce(event => {
      this.onSubmitHandler(event);
    }, 500);
    this.querySelector('form').addEventListener(
      'input',
      this.debouncedOnSubmit.bind(this)
    );
    this.btnClearFilters = this.querySelector('facet-remove')?.querySelector('a');
  }

  clear() {
    this.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false;
    });

    this.querySelectorAll('price-range input').forEach(input => {
      input.value = '';
    });
  }

  static setListeners() {
    const onHistoryChange = event => {
      const searchParams = event.state
        ? event.state.searchParams
        : FacetFiltersForm.searchParamsInitial;
      if (searchParams === FacetFiltersForm.searchParamsPrev) return;
      FacetFiltersForm.renderPage(searchParams, null, false);
    };
    window.addEventListener('popstate', onHistoryChange);
  }

  static renderPage(searchParams, event, updateURLHash = true) {
    FacetFiltersForm.searchParamsPrev = searchParams;
    const sections = FacetFiltersForm.getSections();

    sections.forEach(section => {
      const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
      const filterDataUrl = element => element.url === url;

      FacetFiltersForm.filterData.some(filterDataUrl)
        ? FacetFiltersForm.renderSectionFromCache(
          filterDataUrl,
          event
        )
        : FacetFiltersForm.renderSectionFromFetch(url, event);

      if (updateURLHash) FacetFiltersForm.updateURLHash(searchParams);
    });
  }

  static renderSectionFromFetch(url, event) {
    fetch(url)
      .then(response => response.text())
      .then(responseText => {
        const html = responseText;
        FacetFiltersForm.filterData = [
          ...FacetFiltersForm.filterData,
          { html, url }
        ];
        FacetFiltersForm.renderFilters(html, event);
        FacetFiltersForm.renderProductGridContainer(html);
        FacetFiltersForm.renderProductCount(html);
        FacetFiltersForm.renderCollectionView(html);
      });
  }

  static renderSectionFromCache(filterDataUrl, event) {
    const html = FacetFiltersForm.filterData.find(filterDataUrl).html;
    FacetFiltersForm.renderFilters(html, event);
    FacetFiltersForm.renderProductGridContainer(html);
    FacetFiltersForm.renderProductCount(html);
    FacetFiltersForm.renderCollectionView(html);
  }

  static renderCollectionView(html) {
    const collectionView = document.querySelector('collection-view');
    const collectionViewParent = collectionView?.parentElement;

    if (!collectionView) {
      return;
    }

    const updatedCollectionView = new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector('collection-view');

    if (!updatedCollectionView) {
      return;
    }

    const updatedCollectionViewParent = updatedCollectionView.parentElement;
    const isHidden = updatedCollectionViewParent.classList.contains('hidden');

    isHidden ? collectionViewParent.classList.add('hidden') : collectionViewParent.classList.remove('hidden');
  }

  static renderProductGridContainer(html) {
    const productGridContainer = document.querySelector('#ProductGridContainer');
    const collectionView = document.querySelector('collection-view');

    const updatedProductGridContainer = new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector('#ProductGridContainer');

    if (collectionView) {
      const btnActive = collectionView.querySelector('.js-btn:disabled');
      const updatedProductGrid = updatedProductGridContainer.querySelector('#product-grid');

      updatedProductGrid ? updatedProductGrid.dataset.cols = btnActive.dataset.cols : '';
    }

    productGridContainer.innerHTML = updatedProductGridContainer.innerHTML;
  }

  static renderProductCount(html) {
    const count = new DOMParser()
      .parseFromString(html, 'text/html')
      .getElementById('ProductCount');
    const container = document.getElementById('ProductCount');

    if (container) {
      container.innerHTML = count ? count.innerHTML : '';
    }
  }

  static renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(
      html,
      'text/html'
    );

    const facetDetailsElements = parsedHTML.querySelectorAll(
      '#FacetFiltersForm .js-filter'
    );
    const matchesIndex = element => {
      const jsFilter = event
        ? event.target.closest('.js-filter')
        : undefined;
      return jsFilter
        ? element.dataset.index === jsFilter.dataset.index
        : false;
    };
    const facetsToRender = Array.from(facetDetailsElements).filter(
      element => !matchesIndex(element)
    );
    const countsToRender = Array.from(facetDetailsElements).find(
      matchesIndex
    );

    facetsToRender.forEach(element => {
      document.querySelector(
        `.js-filter[data-index="${element.dataset.index}"]`
      ).innerHTML = element.innerHTML;
    });

    FacetFiltersForm.renderActiveFacets(parsedHTML);

    if (countsToRender)
      FacetFiltersForm.renderCounts(
        countsToRender,
        event.target.closest('.js-filter')
      );
  }

  static renderActiveFacets(html) {
    const activeFacetElementSelector = '.js-facets-active';
    const activeFacetsElement = html.querySelector(
      activeFacetElementSelector
    );

    if (!activeFacetsElement) return;
    document.querySelector(activeFacetElementSelector).outerHTML =
      activeFacetsElement.outerHTML;
  }

  static renderCounts(source, target) {
    const selector = '.js-facets-selected';
    const targetElement = target.querySelector(selector);
    const sourceElement = source.querySelector(selector);

    if (sourceElement && targetElement) {
      target.querySelector(selector).outerHTML =
        source.querySelector(selector).outerHTML;
    }
  }

  static updateURLHash(searchParams) {
    history.pushState(
      { searchParams },
      '',
      `${window.location.pathname}${searchParams && '?'.concat(searchParams)
      }`
    );
  }

  static getSections() {
    return [
      {
        section: document.querySelector('facet-filters-form').dataset
          .sectionId
      }
    ];
  }

  onSubmitHandler(event) {
    event.preventDefault();
    const context = event.target.id.includes('desktop')
      ? 'mobile'
      : 'desktop';
    const formData = new FormData();
    const formDataElements = Array.from(
      event.target.closest('form').elements
    ).filter(
      element =>
        !element.id.includes(context) || element.name === 'sort_by'
    );
    let sortByValue = null;

    for (const element of formDataElements) {
      if (!element.name) continue;
      if (element.type === 'checkbox') {
        if (element.checked) {
          formData.append(element.name, element.value);
        }
      } else {
        formData.append(element.name, element.value);

        if (element.name === 'sort_by') {
          sortByValue = element.value;
        }
      }
    }
    const searchParams = new URLSearchParams(formData).toString();
    FacetFiltersForm.renderPage(searchParams, event);

    if (!sortByValue) {
      return;
    }

    const sortParam = 'sort_by=';
    const sortValueIndex = this.btnClearFilters.href.indexOf(sortParam);
    let updatedBtnURL = this.btnClearFilters.href.slice(0, sortValueIndex + sortParam.length) + sortByValue;

    const currentSearch = new URLSearchParams(window.location.search);
    if (currentSearch.has('q')) {
      const qValue = currentSearch.get('q');
      if (!updatedBtnURL.includes('q=')) {
        updatedBtnURL = updatedBtnURL.replace('?', `?q=${qValue}&`);
      }
    }

    this.btnClearFilters.href = updatedBtnURL;
  }

  onActiveFilterClick(event) {
    event.preventDefault();
    const url =
      event.currentTarget.href.indexOf('?') == -1
        ? ''
        : event.currentTarget.href.slice(
          event.currentTarget.href.indexOf('?') + 1
        );
    FacetFiltersForm.renderPage(url);
  }
}

FacetFiltersForm.filterData = [];
FacetFiltersForm.searchParamsInitial =
  window.location.search.slice(1);
FacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
customElements.define('facet-filters-form', FacetFiltersForm);
FacetFiltersForm.setListeners();

class PriceRange extends HTMLElement {
  constructor() {
    super();
    this.inputs = this.querySelectorAll('input');
    this.inputs.forEach(element =>
      element.addEventListener(
        'change',
        this.onRangeChange.bind(this)
      )
    );

    this.setMinAndMaxValues();
  }

  onRangeChange(event) {
    this.adjustToValidValues(event.currentTarget);
    this.setMinAndMaxValues();
  }

  setMinAndMaxValues() {
    const minInput = this.inputs[0];
    const maxInput = this.inputs[1];
    if (maxInput.value) minInput.setAttribute('max', maxInput.value);
    if (minInput.value) maxInput.setAttribute('min', minInput.value);
    if (minInput.value === '') maxInput.setAttribute('min', 0);
    if (maxInput.value === '')
      minInput.setAttribute('max', maxInput.getAttribute('max'));
  }

  adjustToValidValues(input) {
    const value = Number(input.value);
    const min = Number(input.getAttribute('min'));
    const max = Number(input.getAttribute('max'));

    if (value < min) input.value = min;
    if (value > max) input.value = max;
  }
}

customElements.define('price-range', PriceRange);

class FacetRemove extends HTMLElement {
  constructor() {
    super();
    this.querySelector('a').addEventListener('click', event => {
      event.preventDefault();
      const form =
        this.closest('facet-filters-form') ||
        document.querySelector('facet-filters-form');
      form.onActiveFilterClick(event);
      form.clear();
    });
  }
}

customElements.define('facet-remove', FacetRemove);
