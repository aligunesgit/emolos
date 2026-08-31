let map;
const mapElement = document.getElementById('google_map');

async function initiateGoogleMap() {
  const cards = document.querySelectorAll(
    '.store-locator-cards__filtered'
  );
  const asideCards = document.querySelectorAll(
    '.store-locator-cards__aside-filtered'
  );

  const storeLongitude = Array.from(
    document.querySelectorAll(
      '.store-locator__card-content-aside .store-locator-card__longitude'
    )
  ).map(item => item.textContent);
  const storeLatitude = Array.from(
    document.querySelectorAll(
      '.store-locator__card-content-aside .store-locator-card__latitude'
    )
  ).map(item => item.textContent);
  const coordinateTitle = Array.from(
    document.querySelectorAll(
      '.store-locator__card-content-aside .store-locator-card__coordinate-title'
    )
  ).map(item => item.textContent);
  const coordinateAddress = Array.from(
    document.querySelectorAll(
      '.store-locator__card-content-aside .store-locator-card__address'
    )
  ).map(item => item.textContent);

  const mapZoomLevelElement =
    document.getElementById('map-zoom-level');
  let mapZoomLevel = 4;
  if (mapZoomLevelElement) {
    mapZoomLevel = Number(mapZoomLevelElement.innerHTML);
  }
  const mapZoomLevelUnit = mapZoomLevel <= 18 ? 3 : 0;

  const locations = [];

  for (let i = 0; i < storeLongitude.length; i++) {
    const coordinateIndex = i;
    const coordinatLatitude = Number(storeLatitude[coordinateIndex]);
    const coordinateT = coordinateTitle[coordinateIndex];
    const coordinateA = coordinateAddress[coordinateIndex];
    const tooltipContent =
      coordinateA && !coordinateT ? coordinateA : coordinateT;

    if (coordinatLatitude && (tooltipContent || 'n/a')) {
      locations.push([
        `<b>${tooltipContent}</b><br/><a href="https://maps.google.com/?q=${coordinatLatitude},${Number(
          storeLongitude[i]
        )}" target="_blank" style="text-decoration: underline;">Location</a>`,
        coordinatLatitude,
        Number(storeLongitude[i])
      ]);
    }
  }

  const minLongitude = Math.min(...storeLongitude);
  const minLatitude = Math.min(...storeLatitude);
  const maxLongitude = Math.max(...storeLongitude);
  const maxLatitude = Math.max(...storeLatitude);

  const centerLatitude = (minLatitude + maxLatitude) / 2;
  const centerLongitude = (minLongitude + maxLongitude) / 2;

  if (
    typeof google === 'undefined' ||
    typeof google.maps === 'undefined'
  ) {
    return;
  }

  map = new google.maps.Map(mapElement, {
    zoom: mapZoomLevel,
    center: { lat: centerLatitude, lng: centerLongitude },
    scrollwheel: true,
    gestureHandling: 'greedy',
    disableDefaultUI: true,
    backgroundColor: '#89b4f8'
  });

  const pinIcon = {
    url: mapElement.dataset.mapPinIcon
  };

  const infowindow = new google.maps.InfoWindow({
    maxWidth: 200
  });

  const setMapClickHandler = (item, i) => {
    item.addEventListener('click', function () {
      map.panTo(
        new google.maps.LatLng(locations[i][1], locations[i][2])
      );
      map.setZoom(mapZoomLevel + mapZoomLevelUnit);
    });
  };

  for (let i = 0; i < locations.length; i++) {
    setMapClickHandler(asideCards[i], i);
    setMapClickHandler(cards[i], i);

    const marker = new google.maps.Marker({
      position: new google.maps.LatLng(
        locations[i][1],
        locations[i][2]
      ),
      map,
      title: '',
      icon: pinIcon
    });

    google.maps.event.addListener(
      marker,
      'click',
      (function (marker, count) {
        return function () {
          infowindow.setContent(locations[count][0]);
          infowindow.open(map, marker);
          map.panTo(this.getPosition());
        };
      })(marker, i)
    );
  }
}

initiateGoogleMap();
