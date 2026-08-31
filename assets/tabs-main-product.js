function openTab(evt, tabName, tabWrapper) {
  const tabWrapperElement = document.getElementById(tabWrapper);

  // Hide all tab contents within the given tabWrapper
  const tabcontents = tabWrapperElement.querySelectorAll(
    '.main-product__tab-content'
  );
  tabcontents.forEach(content => {
    content.style.display = 'none';
  });

  // Remove 'active' class from all tab links within the given tabWrapper
  const tablinks = tabWrapperElement.querySelectorAll(
    '.main-product__tab'
  );
  tablinks.forEach(link => {
    link.classList.remove('active');
  });

  // Show the current tab and add the 'active' class to the button that opened the tab
  const currentTabContent = tabWrapperElement.querySelector(
    `#${tabName}`
  );
  if (currentTabContent) {
    currentTabContent.style.display = 'block';
    if (evt.currentTarget) {
      evt.currentTarget.classList.add('active');
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {
  function simulateClick(element) {
    const event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    element.dispatchEvent(event);
  }

  // Get all the wrapper elements for each instance
  const tabWrappers = document.querySelectorAll(
    '.main-product__tabs-wrapper'
  );

  // Loop through each instance to find and click the default open tab
  tabWrappers.forEach(wrapper => {
    // get the wrapperID only if it exists
    const wrapperID = wrapper.getAttribute('id');
    if (!wrapperID) return;

    // get all the tabs marked as default open for every instance
    const defaultOpenTabs = wrapper.querySelectorAll(
      '.main-product__tab[data-default-open]'
    );

    // Loop through each default open tab and click it
    defaultOpenTabs.forEach(tabToClick => {
      simulateClick(tabToClick);
    });
  });
});
