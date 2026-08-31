if (Shopify.designMode) {
  window.addEventListener('shopify:section:select', function (event) {
    closeDrawer();
  });
  window.addEventListener('shopify:section:deselect', function (event) {
    closeDrawer();
  });
  window.addEventListener('shopify:section:reorder', function (event) {
    closeDrawer();
  });
  /** Block */
  window.addEventListener('shopify:block:select', function (event) {
    const shoppableDrawer = event.target.closest('.shoppable-drawer');

    if (!shoppableDrawer) {
      return;
    }

    if (!event.target.className.includes('shoppable')) {
      return closeDrawer();
    }

    shoppableDrawer.classList.add('open');

    if (shoppableDrawer.getAttribute('data-content-mode') !== 'scroll') {
      const itemIndex = event.target.parentElement.getAttribute('data-index');
      shoppableDrawer.openWithIndex(event, itemIndex);
    }
    else {
      const tagElement = event.target.closest('.shoppable-drawer__tags');
      const tag = tagElement ? tagElement.getAttribute('id').split('--')[1] : null;

      if (tag) {
        shoppableDrawer.openWithTag(event, tag);
      }
    }
  });
  window.addEventListener('shopify:block:deselect', function (event) {
    closeDrawer();
    scrollToSection(event.target);
  });
  document.querySelector('.button__shoppable-product-card').addEventListener('click', function (event) {
    const button = event.target;
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', !isExpanded);
  });
}

function checkDrawer() {
  const layoutMode = document.querySelector('shoppable-drawer').getAttribute('data-layout-mode');
  const contentMode = document.querySelector('shoppable-drawer').getAttribute('data-content-mode');
  if (layoutMode !== 'single' && contentMode !== 'scroll') return true;
  return false;
}

function closeDrawer() {
  const drawers = document.querySelectorAll('shoppable-drawer');

  drawers.forEach(drawer => {
    drawer.close();
  });
}

function scrollToBlock(element) {
  if (!element) return;
  const y = element.getBoundingClientRect().top + window.scrollY;
  window.scroll({
    top: y,
  });
}

function scrollToSection(element) {
  if (!element) return;
  const sectionId = element.getAttribute('data-section-id');
  const section = document.getElementById(`section-${sectionId}`);
  scrollToBlock(section);
}
