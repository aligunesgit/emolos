let cards = document.querySelectorAll(
  '.store-locator-cards__filtered'
);
let asideCards = document.querySelectorAll(
  '.store-locator-cards__aside-filtered'
);
let cardContent = document.querySelectorAll(
  '.store-locator-card__text-content'
);
let storeImages = document.querySelectorAll('.store-locator__image-selector');
let swiperSlider = document.getElementById('store-locator-slider');


function liveSearch() {
  let search_query = document.getElementById(
    'search-store-locator'
  ).value;
  for (let i = 0; i < cards.length; i++) {
    if (
      cardContent[i].textContent
        .toLowerCase()
        .includes(search_query.toLowerCase())
    ) {
      cards[i].classList.remove('hidden');
      asideCards[i].classList.remove('hidden');
      storeImages.length > 0 && storeImages[i].classList.remove('hidden');
      swiperSlider.classList.remove('store-locator-slider-filtered');
    } else {
      cards[i].classList.add('hidden');
      asideCards[i].classList.add('hidden');
      storeImages.length > 0 && storeImages[i].classList.add('hidden');
      swiperSlider.classList.add('store-locator-slider-filtered');
    }
  }
}

let searchInput = document.getElementById('search-store-locator');

searchInput.addEventListener('keyup', event => {
  event.preventDefault();
  liveSearch();
});

searchInput.addEventListener('keypress', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
  }
});

searchInput.addEventListener('search', () => {
  let search_query = document.getElementById(
    'search-store-locator'
  ).value;
  if (search_query === '') {
    for (let i = 0; i < cards.length; i++) {
      cards[i].classList.remove('hidden');
      asideCards[i].classList.remove('hidden');
      storeImages.length > 0 && storeImages[i].classList.remove('hidden');
      swiperSlider.classList.remove('store-locator-slider-filtered');
    }
  }
});

asideCards.forEach((item, i) => {
  item.addEventListener('click', () => {
    for (let storeImage of storeImages) {
      if (
        storeImage.getAttribute('data-image-number') ===
        asideCards[i].getAttribute('data-image-number')
      ) {
        storeImage.classList.remove('hidden');
      } else {
        storeImage.classList.add('hidden');
      }
    }
  });
});

cards.forEach((item, i) => {
  item.addEventListener('click', () => {
    for (let storeImage of storeImages) {
      if (
        storeImage.getAttribute('data-image-number') ===
        cards[i].getAttribute('data-image-number')
      ) {
        storeImage.classList.remove('hidden');
      } else {
        storeImage.classList.add('hidden');
      }
    }
  });
});
