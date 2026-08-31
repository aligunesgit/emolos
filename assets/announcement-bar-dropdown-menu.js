class AnnouncementBarDropdown extends HTMLElement {
  constructor() {
    super();
    const toggleButton = document.querySelector(
      '.bar__content-container-dropdown'
    );
    const closeButton = this.querySelector(
      '#NavClose-AnnouncementDropdown'
    );
    toggleButton.addEventListener('click', e => {
      e.preventDefault();
      this.openDropdown(toggleButton);
    });
    closeButton.addEventListener('click', e => {
      e.preventDefault();
      this.closeDropdown(toggleButton);
    });
  }
  openDropdown(toggleButton) {
    const isDropdownOpen = this.hasAttribute('open');
    if (!isDropdownOpen) {
      this.setAttribute('open', '');
      this.classList.add('dropdown-open');
      toggleButton.classList.add('is-active');
      if (DeviceDetector.isMobile()) {
        document.body.classList.add('overflow-hidden');
      }
    } else {
      this.removeAttribute('open');
      this.classList.remove('dropdown-open');
      toggleButton.classList.remove('is-active');
      if (DeviceDetector.isMobile()) {
        document.body.classList.remove('overflow-hidden');
      }
    }
  }
  closeDropdown(toggleButton) {
    const isDropdownOpen = this.hasAttribute('open');
    if (isDropdownOpen) {
      this.removeAttribute('open');
      this.classList.remove('dropdown-open');
      toggleButton.classList.remove('is-active');
      if (DeviceDetector.isMobile()) {
        document.body.classList.remove('overflow-hidden');
      }
    }
  }
}
customElements.define('announcement-bar-dropdown', AnnouncementBarDropdown);
