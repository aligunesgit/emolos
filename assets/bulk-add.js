class BulkAdd extends HTMLElement {
  static ASYNC_REQUEST_DELAY = 300;

  constructor() {
    super();
    this.queue = [];
    this.requestStarted = false;
    this.ids = [];
  }

  startQueue(id, quantity) {
    this.queue.push({ id, quantity });
    const interval = setInterval(() => {
      if (this.queue.length > 0) {
        if (!this.requestStarted) {
          this.sendRequest(this.queue);
        }
      } else {
        clearInterval(interval);
      }
    }, BulkAdd.ASYNC_REQUEST_DELAY);
  }

  sendRequest(queue = this.queue) {
    this.requestStarted = true;
    const items = {};
    queue.forEach((queueItem) => {
      items[queueItem.id] = queueItem.quantity;
    });
    this.queue = this.queue.filter((queueElement) => !queue.includes(queueElement));

    const ids = Object.keys(items);
    this.updateMultipleQty(items, ids);
  }

  updateMultipleQty() {
    // This method should be overridden by child classes
  }

  validateQuantity(event) {
    const inputValue = parseInt(event.target.value);
    const index = event.target.dataset.index;

    // Check if input value is valid
    if (inputValue < parseInt(event.target.min) ||
        (event.target.max && inputValue > parseInt(event.target.max))) {
      const min = parseInt(event.target.min);
      const max = event.target.max ? parseInt(event.target.max) : null;

      if (inputValue < min) {
        event.target.value = min;
      } else if (max && inputValue > max) {
        event.target.value = max;
      }
    }

    if (inputValue !== 0) {
      this.startQueue(index, inputValue);
    }
  }

  setRequestStarted(state) {
    this.requestStarted = state;
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector).innerHTML;
  }

  toggleLoading(loading) {
    // This method can be overridden by child classes if needed
    // Default implementation does nothing
  }
}

if (typeof customElements.get('bulk-add') === 'undefined') {
  customElements.define('bulk-add', BulkAdd);
}
