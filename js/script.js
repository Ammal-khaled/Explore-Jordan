let jordanMap = null;
let mapMarkers = [];
let fadeObserver = null;
let destinationsData = [];
let activitiesData = [];
let mapLanguage = 'en';
const BOOKING_AFFILIATE_ID = 'PLACEHOLDER_AID';
const fallbackImagePath = 'assets/images/petra.jpg';

const markersData = [
  {
    id: 'petra',
    name: 'Petra',
    name_ar: '\u0627\u0644\u0628\u062a\u0631\u0627\u0621',
    lat: 30.3285,
    lng: 35.4444,
  },
  {
    id: 'wadi-rum',
    name: 'Wadi Rum',
    name_ar: '\u0648\u0627\u062f\u064a \u0631\u0645',
    lat: 29.5739,
    lng: 35.4214,
  },
  {
    id: 'dead-sea',
    name: 'Dead Sea',
    name_ar: '\u0627\u0644\u0628\u062d\u0631 \u0627\u0644\u0645\u064a\u062a',
    lat: 31.559,
    lng: 35.4732,
  },
  {
    id: 'amman',
    name: 'Amman',
    name_ar: '\u0639\u0645\u0651\u0627\u0646',
    lat: 31.9539,
    lng: 35.9106,
  },
  {
    id: 'aqaba',
    name: 'Aqaba',
    name_ar: '\u0627\u0644\u0639\u0642\u0628\u0629',
    lat: 29.5328,
    lng: 35.0063,
  },
];

const activityIcons = {
  'hiking-in-dana': 'fa-hiking',
  'diving-in-aqaba': 'fa-swimmer',
  'hot-air-ballooning-wadi-rum': 'fa-mountain-sun',
  'camel-trekking': 'fa-horse',
  'petra-by-night': 'fa-moon',
  'dead-sea-floating': 'fa-water',
  'jerash-ruins-tour': 'fa-landmark',
  'wadi-rum-jeep-tour': 'fa-car',
};

const favoritesStorageKey = 'exploreJordanFavorites';
const tripStorageKey = 'exploreJordanTripItems';

function isPagesDirectory() {
  return window.location.pathname.includes('/pages/');
}

function getDataPath(fileName) {
  return `${isPagesDirectory() ? '../' : ''}data/${fileName}`;
}

function resolveAssetPath(path) {
  if (!path) {
    return resolveAssetPath(fallbackImagePath);
  }

  const value = String(path).trim();

  if (/^(https?:)?\/\//i.test(value)) {
    return safeHttpUrl(value) || resolveAssetPath(fallbackImagePath);
  }

  if (/^[a-z][a-z\d+.-]*:/i.test(value)) {
    return resolveAssetPath(fallbackImagePath);
  }

  if (value.startsWith('/') || value.startsWith('../')) {
    return value;
  }

  return isPagesDirectory() ? `../${value}` : value;
}

function safeHttpUrl(value) {
  try {
    const rawUrl = String(value || '').trim();
    if (!/^https?:\/\//i.test(rawUrl)) return null;
    const url = new URL(rawUrl);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch (error) {
    return null;
  }
}

function setStructuredData(id, data) {
  let script = document.getElementById(id);

  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(data);
}

function absoluteAssetUrl(path) {
  try {
    const url = new URL(resolveAssetPath(path), window.location.href);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined;
  } catch (error) {
    return undefined;
  }
}

function imageMarkup(path, alt, className = '') {
  const source = resolveAssetPath(path);
  const fallback = resolveAssetPath(fallbackImagePath);
  const classAttribute = className ? ` class="${escapeHTML(className)}"` : '';

  return `<img src="${escapeHTML(source)}" alt="${escapeHTML(alt)}"${classAttribute} loading="lazy" data-fallback-image="${escapeHTML(fallback)}">`;
}

function applyImageFallbacks(scope = document) {
  scope.querySelectorAll('img').forEach((image) => {
    if (image.dataset.fallbackReady === 'true') {
      return;
    }

    if (!image.dataset.fallbackImage) {
      image.dataset.fallbackImage = resolveAssetPath(fallbackImagePath);
    }

    image.dataset.fallbackReady = 'true';
    image.addEventListener('error', () => {
      if (image.src !== image.dataset.fallbackImage) {
        image.src = image.dataset.fallbackImage;
      }
    });
  });
}

function getAttractionDetailPath(destination) {
  const id = destination.id || destination.slug;
  const filePath = isPagesDirectory() ? 'attraction.html' : 'pages/attraction.html';
  return `${filePath}?id=${encodeURIComponent(id)}`;
}

function escapeHTML(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return entities[character];
  });
}

function getFavorites() {
  try {
    const favorites = JSON.parse(localStorage.getItem(favoritesStorageKey)) || [];
    return Array.isArray(favorites) ? favorites : [];
  } catch (error) {
    return [];
  }
}

function saveFavorites(favorites) {
  localStorage.setItem(favoritesStorageKey, JSON.stringify(favorites));
}

function isFavorite(type, id) {
  return getFavorites().some((favorite) => favorite.type === type && favorite.id === id);
}

function toggleFavorite(type, id) {
  const favorites = getFavorites();
  const existingIndex = favorites.findIndex(
    (favorite) => favorite.type === type && favorite.id === id
  );

  if (existingIndex >= 0) {
    favorites.splice(existingIndex, 1);
  } else {
    favorites.push({ type, id });
  }

  saveFavorites(favorites);
  updateFavoriteButtons();
}

function updateFavoriteButtons() {
  document.querySelectorAll('[data-favorite-type][data-favorite-id]').forEach((button) => {
    const active = isFavorite(button.dataset.favoriteType, button.dataset.favoriteId);
    const icon = button.querySelector('i');

    button.classList.toggle('favorite-button--active', active);
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', active ? 'Remove from favorites' : 'Add to favorites');

    if (icon) {
      icon.classList.toggle('fas', active);
      icon.classList.toggle('far', !active);
    }
  });
}

function getTripItems() {
  try {
    const items = JSON.parse(localStorage.getItem(tripStorageKey)) || [];
    return Array.isArray(items) ? items : [];
  } catch (error) {
    return [];
  }
}

function saveTripItems(items) {
  localStorage.setItem(tripStorageKey, JSON.stringify(items));
}

function addToTrip(item) {
  const items = getTripItems();
  const exists = items.some(
    (savedItem) => savedItem.type === item.type && savedItem.id === item.id
  );

  if (!exists) {
    items.push(item);
    saveTripItems(items);
  }

  updateTripButtons();
  renderTripPlanner();
}

function removeFromTrip(type, id) {
  const items = getTripItems().filter((item) => !(item.type === type && item.id === id));
  saveTripItems(items);
  updateTripButtons();
  renderTripPlanner();
}

function clearTrip() {
  saveTripItems([]);
  updateTripButtons();
  renderTripPlanner();
}

function isInTrip(type, id) {
  return getTripItems().some((item) => item.type === type && item.id === id);
}

function updateTripButtons() {
  document.querySelectorAll('.trip-button[data-trip-type][data-trip-id]').forEach((button) => {
    const active = isInTrip(button.dataset.tripType, button.dataset.tripId);
    button.classList.toggle('trip-button--active', active);
    button.setAttribute('aria-pressed', String(active));
    const destinationCard = button.closest('.Top-Destinations .item');
    const experienceCard = button.closest('.option');
    const compactOverlay =
      button.classList.contains('trip-button--overlay') &&
      ((destinationCard && !destinationCard.classList.contains('active')) ||
        (experienceCard && !experienceCard.classList.contains('active')));
    button.textContent = compactOverlay
      ? active
        ? '✓'
        : '+'
      : active
        ? 'Added to Trip'
        : 'Add to Trip';
    button.setAttribute(
      'aria-label',
      `${active ? 'Saved in trip' : 'Add to trip'}: ${button.dataset.tripName}`
    );
  });
}

function tripButtonMarkup(item, extraClass = '') {
  return `<button class="trip-button ${extraClass}" type="button"
    data-trip-type="${escapeHTML(item.type)}"
    data-trip-id="${escapeHTML(item.id)}"
    data-trip-name="${escapeHTML(item.name)}"
    data-trip-location="${escapeHTML(item.location)}"
    data-trip-image="${escapeHTML(item.image)}"
    data-trip-category="${escapeHTML(item.category)}"
    aria-label="Add to trip: ${escapeHTML(item.name)}"
    aria-pressed="false">Add to Trip</button>`;
}

function activateCarouselItem(item) {
  const carousel = item.closest('.custom-carousel');

  if (!carousel || typeof $ === 'undefined') {
    return;
  }

  const $carousel = $(carousel);
  $carousel.find('.item').removeClass('active');
  $(item).addClass('active');
  $carousel.trigger('refresh.owl.carousel');
}

function syncCenteredCarouselItem(carousel) {
  const $carousel = $(carousel);
  const $centeredItem = $carousel.find('.owl-item.center .item').first();

  if (!$centeredItem.length) {
    return;
  }

  const selectionChanged = !$centeredItem.hasClass('active');
  $carousel.find('.item').removeClass('active');
  $centeredItem.addClass('active');
  updateTripButtons();

  // Do not refresh Owl during its translated callback; that can reset the
  // navigation position before the newly centered card is painted.
  if (selectionChanged) {
    window.requestAnimationFrame(() => $carousel.trigger('refresh.owl.carousel'));
  }
}

function destinationTripItem(destination) {
  return {
    id: destination.id,
    type: 'destination',
    name: destination.name,
    location: destination.city,
    image: destination.image,
    category: destination.category,
  };
}

function activityTripItem(activity) {
  return {
    id: activity.id,
    type: 'activity',
    name: activity.name,
    location: activity.location,
    image: activity.image,
    category: activity.category,
  };
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

async function fetchJSON(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
  }

  return response.json();
}

function showEmptyState(container, message) {
  renderEmptyState(container, message);
}

function renderNoResults(container, message) {
  showEmptyState(container, message);
}

function renderLoading(container, message) {
  if (!container) {
    return;
  }

  const skeletonCount =
    container.classList.contains('custom-carousel') || container.classList.contains('options')
      ? 4
      : 3;
  const skeletons = Array.from(
    { length: skeletonCount },
    () => '<span class="loading-skeleton-card"></span>'
  ).join('');
  container.innerHTML = `
    <div class="data-state data-state--loading">
      <p>${escapeHTML(message)}</p>
      <div class="loading-skeleton-grid">${skeletons}</div>
    </div>
  `;
}

function renderError(container, message) {
  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="data-state data-state--error">
      <i class="fas fa-circle-exclamation"></i>
      <p>${escapeHTML(message)}</p>
    </div>
  `;
}

function renderEmptyState(container, message) {
  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="data-state data-state--empty">
      <i class="fas fa-map-signs"></i>
      <p>${escapeHTML(message)}</p>
    </div>
  `;
}

function destinationCategories(destination) {
  const categories = new Set(
    (destination.tags || []).map((tag) => String(tag).toLowerCase().replace(/\s+/g, '-'))
  );
  const category = String(destination.category || '').toLowerCase();

  if (category.includes('heritage')) {
    categories.add('historical');
    categories.add('cultural');
  }

  if (category.includes('nature') || category.includes('desert') || category.includes('coast')) {
    categories.add('outdoor');
    categories.add('natural');
  }

  if (category.includes('city')) {
    categories.add('urban');
    categories.add('cultural');
  }

  if (
    category.includes('desert') ||
    (destination.tags || []).some((tag) => String(tag).toLowerCase().includes('adventure'))
  ) {
    categories.add('adventure');
  }

  return Array.from(categories).join(',');
}

function tagList(tags) {
  return (tags || [])
    .slice(0, 3)
    .map((tag) => {
      return `<span class="text-xs px-2 py-1 bg-gray-100 rounded-full">${escapeHTML(tag)}</span>`;
    })
    .join('');
}

function destinationSearchText(destination) {
  return normalizeText(
    [
      destination.name,
      destination.city,
      destination.category,
      destination.shortDescription,
      destination.longDescription,
      ...(destination.tags || []),
    ].join(' ')
  );
}

function activitySearchText(activity) {
  return normalizeText(
    [
      activity.name,
      activity.location,
      activity.category,
      activity.shortDescription,
      activity.longDescription,
      ...(activity.tags || []),
    ].join(' ')
  );
}

function sharesDestinationContext(destination, activity) {
  const destinationCity = normalizeText(destination.city);
  const activityLocation = normalizeText(activity.location);
  const destinationCategory = normalizeText(destination.category);
  const activityCategory = normalizeText(activity.category);
  const destinationTags = (destination.tags || []).map(normalizeText);
  const activityTags = (activity.tags || []).map(normalizeText);

  const sameCityOrLocation =
    Boolean(destinationCity && activityLocation) &&
    (destinationCity === activityLocation ||
      destinationCity.includes(activityLocation) ||
      activityLocation.includes(destinationCity));
  const matchingCategory =
    Boolean(destinationCategory && activityCategory) && destinationCategory === activityCategory;
  const matchingTags = destinationTags.some((tag) => activityTags.includes(tag));

  return sameCityOrLocation || matchingCategory || matchingTags;
}

function filterDestinations(data, filters = {}) {
  const query = normalizeText(filters.query);
  const category = normalizeText(filters.category || 'all');
  const city = normalizeText(filters.city || 'all');

  return (Array.isArray(data) ? data : []).filter((destination) => {
    const destinationCategory = normalizeText(destination.category);
    const categories = destinationCategories(destination).split(',').map(normalizeText);
    const matchesQuery = !query || destinationSearchText(destination).includes(query);
    const matchesCategory =
      category === 'all' || destinationCategory === category || categories.includes(category);
    const matchesCity = city === 'all' || normalizeText(destination.city) === city;

    return matchesQuery && matchesCategory && matchesCity;
  });
}

function filterActivities(data, filters = {}) {
  const query = normalizeText(filters.query);
  const category = normalizeText(filters.category || 'all');

  return (Array.isArray(data) ? data : []).filter((activity) => {
    const matchesQuery = !query || activitySearchText(activity).includes(query);
    const matchesCategory = activityMatchesTab(activity.category, category);

    return matchesQuery && matchesCategory;
  });
}

function renderDestinationCards(data, container) {
  if (!container) {
    return;
  }

  if (!Array.isArray(data) || data.length === 0) {
    renderEmptyState(container, 'No destination cards are available right now.');
    return;
  }

  const isCarousel = container.classList.contains('custom-carousel');

  if (isCarousel) {
    container.innerHTML = data
      .map(
        (destination, index) => `
      <div class="item${index === 0 ? ' active' : ''}">
        ${imageMarkup(destination.image, destination.name, 'item-image')}
        <button class="favorite-button favorite-button--overlay" type="button" data-favorite-type="destination" data-favorite-id="${escapeHTML(destination.id)}" aria-label="Add to favorites" aria-pressed="false">
          <i class="far fa-heart"></i>
        </button>
        ${tripButtonMarkup(destinationTripItem(destination), 'trip-button--overlay')}
        <div class="item-title">
          <h3>${escapeHTML(destination.name)}</h3>
        </div>
        <div class="item-desc">
          <p>${escapeHTML(destination.shortDescription)}</p>
        </div>
      </div>
    `
      )
      .join('');
    applyImageFallbacks(container);
    updateFavoriteButtons();
    updateTripButtons();
    return;
  }

  container.innerHTML = data
    .map((destination) => {
      const mapUrl = safeHttpUrl(destination.mapLink);
      const mapAction = mapUrl
        ? `
            <a href="${escapeHTML(mapUrl)}" target="_blank" rel="noopener" class="inline-block gold-accent text-white font-semibold px-4 py-2 rounded-full hover:bg-yellow-600 transition flex-1 text-center">
              <i class="fas fa-map-marker-alt mr-2"></i> View Map
            </a>`
        : '';

      return `
    <div class="destination-card" data-categories="${escapeHTML(destinationCategories(destination))}">
      <div class="bg-white rounded-xl overflow-hidden shadow-lg card-hover h-full">
        <div class="relative">
          ${imageMarkup(destination.image, destination.name, 'w-full h-48 object-cover')}
          <button class="favorite-button favorite-button--overlay" type="button" data-favorite-type="destination" data-favorite-id="${escapeHTML(destination.id)}" aria-label="Add to favorites" aria-pressed="false">
            <i class="far fa-heart"></i>
          </button>
        </div>
        <div class="p-6">
          <div class="flex flex-wrap gap-2 mb-3">
            ${tagList(destination.tags)}
          </div>
          <h3 class="text-xl font-bold dark-brown-text mb-2">${escapeHTML(destination.name)}</h3>
          <p class="dark-gray-text mb-4">${escapeHTML(destination.longDescription || destination.shortDescription)}</p>
          <div class="flex space-x-3">
            ${mapAction}
            <a href="${escapeHTML(getAttractionDetailPath(destination))}" class="inline-block border border-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-full hover:bg-gray-100 transition flex-1 text-center">
              <i class="fas fa-info-circle mr-2"></i> Details
            </a>
          </div>
          <div class="mt-3">
            ${tripButtonMarkup(destinationTripItem(destination))}
          </div>
        </div>
      </div>
    </div>
  `;
    })
    .join('');
  applyImageFallbacks(container);
  updateFavoriteButtons();
  updateTripButtons();
}

function renderActivityCards(data, container) {
  if (!container) {
    return;
  }

  if (!Array.isArray(data) || data.length === 0) {
    renderEmptyState(container, 'No activity cards are available right now.');
    return;
  }

  const isExperienceStrip = container.classList.contains('options');

  if (isExperienceStrip) {
    container.innerHTML = data
      .map(
        (activity, index) => `
      <div class="option${index === 0 ? ' active' : ''}">
        ${imageMarkup(activity.image, activity.name, 'option-image')}
        <button class="favorite-button favorite-button--overlay" type="button" data-favorite-type="activity" data-favorite-id="${escapeHTML(activity.id)}" aria-label="Add to favorites" aria-pressed="false">
          <i class="far fa-heart"></i>
        </button>
        ${tripButtonMarkup(activityTripItem(activity), 'trip-button--overlay')}
        <div class="shadow"></div>
        <div class="label">
          <div class="icon">
            <i class="fas ${activityIcons[activity.id] || 'fa-map-location-dot'}"></i>
          </div>
          <div class="info">
            <div class="main">${escapeHTML(activity.name)}</div>
            <div class="sub">${escapeHTML(activity.shortDescription)}</div>
          </div>
        </div>
      </div>
    `
      )
      .join('');
    applyImageFallbacks(container);
    updateFavoriteButtons();
    updateTripButtons();
    return;
  }

  container.innerHTML = data
    .map((activity, index) => {
      const mapUrl = safeHttpUrl(activity.mapLink);

      return `
    <div class="experience-card bg-white rounded-xl overflow-hidden" data-category="${escapeHTML(String(activity.category || '').toLowerCase())}" data-aos="fade-up" data-aos-delay="${100 + (index % 3) * 100}">
      <div class="relative">
        ${imageMarkup(activity.image, activity.name, 'w-full h-64 object-cover')}
        <button class="favorite-button favorite-button--overlay" type="button" data-favorite-type="activity" data-favorite-id="${escapeHTML(activity.id)}" aria-label="Add to favorites" aria-pressed="false">
          <i class="far fa-heart"></i>
        </button>
        <div class="absolute top-4 right-16 bg-green-800 text-white px-3 py-1 rounded-full text-sm font-semibold hover-grow">
          ${escapeHTML(activity.category)}
        </div>
      </div>
      <div class="p-6">
        <h3 class="text-xl font-bold mb-2 text-gray-800">${escapeHTML(activity.name)}</h3>
        <p class="text-gray-600 mb-4">${escapeHTML(activity.longDescription || activity.shortDescription)}</p>
        <div class="flex justify-between items-center gap-4">
          <div class="text-sm text-gray-600">
            <i class="fas fa-clock mr-1 text-yellow-500"></i>${escapeHTML(activity.duration)}
          </div>
          ${mapUrl ? `<a href="${escapeHTML(mapUrl)}" target="_blank" rel="noopener" class="text-green-700 hover:text-green-800 font-semibold hover-grow">View Map</a>` : ''}
        </div>
        <div class="mt-4">
          ${tripButtonMarkup(activityTripItem(activity))}
        </div>
      </div>
    </div>
  `;
    })
    .join('');
  applyImageFallbacks(container);
  updateFavoriteButtons();
  updateTripButtons();
}

function renderAccommodationCards(data, container) {
  if (!container) {
    return;
  }

  if (!Array.isArray(data) || data.length === 0) {
    renderEmptyState(container, 'No accommodation cards are available right now.');
    return;
  }

  container.innerHTML = data
    .map((accommodation) => {
      const bookingUrl = safeHttpUrl(accommodation.bookingLink);
      let trackedBookingUrl = bookingUrl;
      let isBookingAffiliate = false;

      if (bookingUrl) {
        try {
          const parsedBookingUrl = new URL(bookingUrl);
          if (/(^|\.)booking\.com$/i.test(parsedBookingUrl.hostname)) {
            isBookingAffiliate = true;
            parsedBookingUrl.searchParams.set('aid', BOOKING_AFFILIATE_ID);
            trackedBookingUrl = parsedBookingUrl.toString();
          }
        } catch (error) {
          trackedBookingUrl = null;
        }
      }

      return `
    <div class="card-shadow bg-white rounded-lg overflow-hidden">
      ${imageMarkup(accommodation.image, accommodation.name, 'w-full h-48 object-cover')}
      <div class="p-4">
        <div class="flex flex-wrap gap-2 mb-3">
          ${tagList(accommodation.tags)}
        </div>
        <h3 class="font-bold text-xl mb-2">${escapeHTML(accommodation.name)}</h3>
        <p>${escapeHTML(accommodation.shortDescription)}</p>
        ${trackedBookingUrl ? `<a href="${escapeHTML(trackedBookingUrl)}" target="_blank" rel="noopener" class="inline-block gold-accent text-white font-semibold px-4 py-2 rounded-full hover:bg-yellow-600 transition w-full text-center mt-4"><i class="fas fa-bed mr-2"></i>${isBookingAffiliate ? 'Book Now' : 'Visit Provider'}</a>${isBookingAffiliate ? '<small class="block mt-2 text-xs text-gray-500">Booking links are affiliate links; we may earn a commission at no extra cost to you.</small>' : ''}` : ''}
      </div>
    </div>
  `;
    })
    .join('');
  setStructuredData('accommodation-structured-data', {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Places to stay in Jordan',
    itemListElement: data.map((accommodation, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'LodgingBusiness',
        name: accommodation.name,
        description: accommodation.shortDescription,
        image: absoluteAssetUrl(accommodation.image),
        url: safeHttpUrl(accommodation.bookingLink),
        address: {
          '@type': 'PostalAddress',
          addressLocality: accommodation.city,
          addressCountry: 'JO',
        },
      },
    })),
  });
  applyImageFallbacks(container);
}

function renderAttractionDetail(destination, relatedActivities, container) {
  const tags = (destination.tags || []).map((tag) => `<span>${escapeHTML(tag)}</span>`).join('');
  const tripItem = destinationTripItem(destination);
  const mapUrl = safeHttpUrl(destination.mapLink);
  const officialUrl = safeHttpUrl(destination.officialLink);
  const relatedMarkup =
    relatedActivities.length > 0
      ? `<div class="attraction-related-grid">${relatedActivities
          .map(
            (activity) => `
        <article class="attraction-related-card">
          ${imageMarkup(activity.image, activity.name)}
          <div>
            <p>${escapeHTML(activity.category)} | ${escapeHTML(activity.duration)}</p>
            <h3>${escapeHTML(activity.name)}</h3>
            <span>${escapeHTML(activity.shortDescription)}</span>
            ${tripButtonMarkup(activityTripItem(activity), 'trip-button--related')}
          </div>
        </article>
      `
          )
          .join('')}</div>`
      : '<p class="attraction-muted">No closely related activities are listed yet.</p>';

  container.innerHTML = `
    <article class="attraction-detail-card">
      <a class="attraction-back" href="top.html">Back to Top Destinations</a>
      <div class="attraction-hero-image">
        ${imageMarkup(destination.image, destination.name)}
      </div>
      <div class="attraction-content">
        <p class="attraction-meta">${escapeHTML(destination.city)} | ${escapeHTML(destination.category)}</p>
        <h1>${escapeHTML(destination.name)}</h1>
        <p>${escapeHTML(destination.longDescription || destination.shortDescription)}</p>
        <div class="attraction-tags">${tags}</div>
        <div class="attraction-actions">
          ${mapUrl ? `<a href="${escapeHTML(mapUrl)}" target="_blank" rel="noopener" class="button-78">View Map</a>` : ''}
          ${officialUrl ? `<a href="${escapeHTML(officialUrl)}" target="_blank" rel="noopener" class="button-78 attraction-secondary-action">Official Link</a>` : ''}
          ${tripButtonMarkup(tripItem, 'trip-button--detail')}
        </div>
      </div>
    </article>
    <section class="attraction-related">
      <h2>Related Activities</h2>
      ${relatedMarkup}
    </section>
  `;
  const marker = markersData.find((item) => item.id === destination.id);
  setStructuredData('attraction-structured-data', {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: destination.name,
    description: destination.longDescription || destination.shortDescription,
    image: absoluteAssetUrl(destination.image),
    url: safeHttpUrl(destination.officialLink),
    sameAs: mapUrl ? [mapUrl] : undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: destination.city,
      addressCountry: 'JO',
    },
    geo: marker
      ? {
          '@type': 'GeoCoordinates',
          latitude: marker.lat,
          longitude: marker.lng,
        }
      : undefined,
  });
  applyImageFallbacks(container);
  updateTripButtons();
}

function renderTripPlanner() {
  const container = document.querySelector('[data-trip-planner]');

  if (!container) {
    return;
  }

  const items = getTripItems();

  if (items.length === 0) {
    container.innerHTML = `
      <div class="data-state data-state--empty">
        <i class="fas fa-route"></i>
        <p>Your trip planner is empty. Add destinations and activities to start shaping your Jordan route.</p>
        <div class="trip-planner-empty-actions">
          <a class="button-78" href="${isPagesDirectory() ? 'top.html' : 'pages/top.html'}">Browse destinations</a>
          <a class="button-78" href="${isPagesDirectory() ? 'activity.html' : 'pages/activity.html'}">Browse experiences</a>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="trip-planner-header">
      <p>${items.length} saved ${items.length === 1 ? 'item' : 'items'}</p>
      <button class="trip-clear-button" type="button" data-trip-clear>Clear Trip</button>
    </div>
    <div class="trip-planner-grid">
      ${items
        .map(
          (item) => `
        <article class="trip-card">
          ${imageMarkup(item.image, item.name)}
          <div class="trip-card__body">
            <span>${escapeHTML(item.type)} | ${escapeHTML(item.category)}</span>
            <h3>${escapeHTML(item.name)}</h3>
            <p>${escapeHTML(item.location)}</p>
            <button class="trip-remove-button" type="button" data-trip-remove data-trip-type="${escapeHTML(item.type)}" data-trip-id="${escapeHTML(item.id)}">Remove</button>
          </div>
        </article>
      `
        )
        .join('')}
    </div>
  `;
  applyImageFallbacks(container);
}

async function initAttractionDetailPage() {
  const container = document.getElementById('attraction-detail');

  if (!container) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const destinationId = normalizeText(params.get('id'));

  renderLoading(container, 'Loading destination details...');

  if (!destinationId) {
    renderError(
      container,
      'Choose a destination from the Top Destinations page to view its details.'
    );
    return;
  }

  try {
    const [destinations, activities] = await Promise.all([
      fetchJSON(getDataPath('destinations.json')),
      fetchJSON(getDataPath('activities.json')),
    ]);
    const destination = (destinations || []).find((item) => {
      return normalizeText(item.id) === destinationId || normalizeText(item.slug) === destinationId;
    });

    if (!destination) {
      renderError(
        container,
        'We could not find that destination. Please return to Top Destinations and choose another place.'
      );
      return;
    }

    document.title = `${destination.name} | Explore Jordan`;
    const relatedActivities = (activities || [])
      .filter((activity) => sharesDestinationContext(destination, activity))
      .slice(0, 3);

    renderAttractionDetail(destination, relatedActivities, container);
    updateFavoriteButtons();
  } catch (error) {
    console.error('Failed to load attraction detail data:', error);
    renderError(container, 'Destination details could not load. Please try again later.');
  }
}

function initMap() {
  const mapElement = document.getElementById('map');

  if (!mapElement || typeof L === 'undefined') {
    return;
  }

  jordanMap = L.map('map').setView([30.5852, 36.2384], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      'Map data &copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(jordanMap);

  updateMarkers(mapLanguage);
}

function initLanguageToggle() {
  try {
    mapLanguage = localStorage.getItem('exploreJordanMapLanguage') === 'ar' ? 'ar' : 'en';
  } catch (error) {
    mapLanguage = 'en';
  }

  const toggles = document.querySelectorAll('[data-language-toggle]');

  function updateToggle(button) {
    const nextLanguage = mapLanguage === 'en' ? 'Arabic' : 'English';
    button.textContent = mapLanguage === 'en' ? 'العربية' : 'English';
    button.setAttribute('aria-label', `Switch map labels to ${nextLanguage}`);
    button.setAttribute('aria-pressed', String(mapLanguage === 'ar'));
  }

  toggles.forEach((button) => {
    updateToggle(button);
    button.addEventListener('click', () => {
      mapLanguage = mapLanguage === 'en' ? 'ar' : 'en';
      try {
        localStorage.setItem('exploreJordanMapLanguage', mapLanguage);
      } catch (error) {
        // The map labels still switch for this page when storage is unavailable.
      }
      toggles.forEach(updateToggle);
      updateMarkers(mapLanguage);
    });
  });
}

function updateMarkers(lang) {
  if (!jordanMap) {
    return;
  }

  mapMarkers.forEach((marker) => jordanMap.removeLayer(marker));
  mapMarkers = markersData.map((data) => {
    const destination = destinationsData.find((item) => item.id === data.id) || data;
    const detailPath = getAttractionDetailPath(destination);
    const label = lang === 'ar' ? data.name_ar : data.name;

    return L.marker([data.lat, data.lng])
      .addTo(jordanMap)
      .bindPopup(
        `<a class="map-popup-link" href="${escapeHTML(detailPath)}">${escapeHTML(label)}</a>`
      );
  });
}

function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');

  if (slides.length === 0) {
    return;
  }

  let currentSlide = 0;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  }

  showSlide(currentSlide);
  setInterval(nextSlide, 2500);
}

function initCarousel() {
  const carousel = document.querySelector('.custom-carousel');

  if (
    !carousel ||
    !carousel.querySelector('.item') ||
    typeof $ === 'undefined' ||
    !$.fn.owlCarousel
  ) {
    return;
  }

  const $carousel = $('.custom-carousel');

  if ($carousel.data('owl.carousel')) {
    $carousel.trigger('destroy.owl.carousel');
    $carousel.removeClass('owl-loaded owl-hidden');
    $carousel.find('.owl-stage-outer').children().unwrap();
  }

  $carousel.off('.exploreJordanCenter');

  $carousel.owlCarousel({
    autoWidth: true,
    loop: true,
    center: true,
    nav: true,
    dots: true,
    navText: ['‹', '›'],
    smartSpeed: 450,
    responsive: {
      0: { margin: 4 },
      769: { margin: 10 },
    },
    onInitialized: (event) => syncCenteredCarouselItem(event.currentTarget),
    onTranslated: (event) => syncCenteredCarouselItem(event.currentTarget),
  });

  syncCenteredCarouselItem(carousel);

  const owlInstance = $carousel.data('owl.carousel');
  $carousel
    .find('.owl-prev')
    .attr('aria-label', 'Previous destination')
    .off('click')
    .on('click.exploreJordanNav', (event) => {
      event.preventDefault();
      owlInstance.prev();
    });
  $carousel
    .find('.owl-next')
    .attr('aria-label', 'Next destination')
    .off('click')
    .on('click.exploreJordanNav', (event) => {
      event.preventDefault();
      owlInstance.next();
    });

  $carousel
    .off('click.exploreJordan', '.item')
    .on('click.exploreJordan', '.item', function (event) {
      if (event.target.closest('button, a')) {
        return;
      }

      activateCarouselItem(this);
    });
}

function initFadeAnimations() {
  const fadeElements = document.querySelectorAll('.fade-in');

  if (fadeElements.length === 0) {
    return;
  }

  fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
        }
      });
    },
    { threshold: 0.1 }
  );

  fadeElements.forEach((element) => {
    fadeObserver.observe(element);
  });

  setTimeout(() => {
    document.querySelectorAll('.fade-in').forEach((element) => {
      element.classList.add('show');
    });
  }, 100);
}

function initExperienceCards() {
  const options = document.querySelectorAll('.option');

  if (options.length === 0) {
    return;
  }

  options.forEach((option) => {
    option.addEventListener('click', function () {
      options.forEach((item) => item.classList.remove('active'));
      this.classList.add('active');
    });
    option.tabIndex = 0;
    option.setAttribute('role', 'button');
    option.setAttribute('aria-expanded', String(option.classList.contains('active')));
    option.addEventListener('keydown', (event) => {
      if (event.target.closest('button, a')) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        options.forEach((item) => {
          item.classList.remove('active');
          item.setAttribute('aria-expanded', 'false');
        });
        option.classList.add('active');
        option.setAttribute('aria-expanded', 'true');
      }
    });
    option.addEventListener('click', (event) => {
      if (event.target.closest('button, a')) return;
      options.forEach((item) => item.setAttribute('aria-expanded', 'false'));
      option.setAttribute('aria-expanded', 'true');
    });
  });

  if (document.querySelectorAll('.option.active').length === 0) {
    options[0].classList.add('active');
  }
}

function initFeaturedSlider() {
  const slides = document.querySelectorAll('.featured-slide');
  const indicators = document.querySelectorAll('.featured-indicator');
  const previousButton = document.getElementById('featuredPrev');
  const nextButton = document.getElementById('featuredNext');

  if (slides.length === 0) {
    return;
  }

  let currentSlide = 0;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('featured-slide--active', i === index);
      slide.classList.toggle('opacity-100', i === index);
      slide.classList.toggle('opacity-0', i !== index);
    });

    indicators.forEach((indicator, i) => {
      indicator.classList.toggle('bg-opacity-100', i === index);
      indicator.classList.toggle('bg-opacity-50', i !== index);
    });

    currentSlide = index;
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      showSlide((currentSlide + 1) % slides.length);
    });
  }

  if (previousButton) {
    previousButton.addEventListener('click', () => {
      showSlide((currentSlide - 1 + slides.length) % slides.length);
    });
  }

  indicators.forEach((indicator) => {
    indicator.addEventListener('click', () => {
      showSlide(Number(indicator.dataset.index) || 0);
    });
  });

  showSlide(0);
  setInterval(() => showSlide((currentSlide + 1) % slides.length), 3000);
}

function initCitySlider() {
  const track = document.getElementById('citySliderTrack');
  const previousButton = document.getElementById('cityPrev');
  const nextButton = document.getElementById('cityNext');

  if (!track || !previousButton || !nextButton) {
    return;
  }

  const slides = Array.from(track.children);
  let currentSlide = 0;

  function slidesToShow() {
    return window.matchMedia('(min-width: 768px)').matches ? 3 : 1;
  }

  function updateCitySlider() {
    const visibleSlides = slidesToShow();
    const maxSlide = Math.max(0, slides.length - visibleSlides);
    currentSlide = Math.min(currentSlide, maxSlide);
    const slideWidth = slides[0] ? slides[0].getBoundingClientRect().width + 32 : 0;
    track.style.transform = `translateX(-${currentSlide * slideWidth}px)`;
    previousButton.disabled = currentSlide === 0;
    nextButton.disabled = currentSlide >= maxSlide;
  }

  nextButton.addEventListener('click', () => {
    currentSlide += 1;
    updateCitySlider();
  });

  previousButton.addEventListener('click', () => {
    currentSlide -= 1;
    updateCitySlider();
  });

  window.addEventListener('resize', updateCitySlider);
  updateCitySlider();
}

function initPageInteractions() {
  applyImageFallbacks(document);

  document.querySelectorAll('[data-scroll-target]').forEach((control) => {
    control.addEventListener('click', () => {
      const target = document.querySelector(control.dataset.scrollTarget);

      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const target = document.querySelector(anchor.getAttribute('href'));

      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  if (typeof AOS !== 'undefined') {
    AOS.init({
      once: true,
      duration: 800,
      easing: 'ease-in-out',
    });
  }
}

function initFavorites() {
  document.addEventListener('click', function (event) {
    const button = event.target.closest('[data-favorite-type][data-favorite-id]');

    if (!button) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(button.dataset.favoriteType, button.dataset.favoriteId);
  });

  updateFavoriteButtons();
}

function initTripPlanner() {
  document.addEventListener('click', function (event) {
    const removeButton = event.target.closest('[data-trip-remove]');
    const clearButton = event.target.closest('[data-trip-clear]');
    const addButton = event.target.closest('.trip-button[data-trip-type][data-trip-id]');

    if (removeButton) {
      event.preventDefault();
      removeFromTrip(removeButton.dataset.tripType, removeButton.dataset.tripId);
      return;
    }

    if (clearButton) {
      event.preventDefault();
      clearTrip();
      return;
    }

    if (addButton) {
      event.preventDefault();
      event.stopPropagation();
      const carouselItem = addButton.closest('.custom-carousel .item');

      if (carouselItem) {
        activateCarouselItem(carouselItem);
      }

      addToTrip({
        id: addButton.dataset.tripId,
        type: addButton.dataset.tripType,
        name: addButton.dataset.tripName,
        location: addButton.dataset.tripLocation,
        image: addButton.dataset.tripImage,
        category: addButton.dataset.tripCategory,
      });
      return;
    }
  });

  renderTripPlanner();
  updateTripButtons();
}

function initDestinationFilters() {
  const container = document.querySelector('[data-render="page-destinations"]');
  const searchInput = document.querySelector('[data-destination-search]');
  const citySelect = document.querySelector('[data-destination-city-filter]');
  const filterButtons = document.querySelectorAll('.filter-btn');

  if (!container || destinationsData.length === 0) {
    return;
  }

  if (citySelect && citySelect.options.length <= 1) {
    const cities = Array.from(
      new Set(destinationsData.map((destination) => destination.city).filter(Boolean))
    ).sort();
    citySelect.insertAdjacentHTML(
      'beforeend',
      cities
        .map((city) => {
          return `<option value="${escapeHTML(city)}">${escapeHTML(city)}</option>`;
        })
        .join('')
    );
  }

  function activeCategory() {
    const activeButton = document.querySelector('.filter-btn.category-active');
    return activeButton ? activeButton.getAttribute('data-category') : 'all';
  }

  function renderFilteredDestinations() {
    const filtered = filterDestinations(destinationsData, {
      query: searchInput ? searchInput.value : '',
      category: activeCategory(),
      city: citySelect ? citySelect.value : 'all',
    });

    if (filtered.length === 0) {
      renderNoResults(
        container,
        'No destinations found. Try a different search, category, or city.'
      );
      return;
    }

    renderDestinationCards(filtered, container);
    refreshAOS();
  }

  if (searchInput) {
    searchInput.addEventListener('input', renderFilteredDestinations);
  }

  if (citySelect) {
    citySelect.addEventListener('change', renderFilteredDestinations);
  }

  filterButtons.forEach((button) => {
    button.addEventListener('click', function () {
      filterButtons.forEach((item) => {
        item.classList.remove('category-active');
        item.classList.add('dark-gray-text');
      });
      this.classList.add('category-active');
      this.classList.remove('dark-gray-text');
      renderFilteredDestinations();
    });
  });
}

function activityMatchesTab(activityCategory, selectedCategory) {
  if (selectedCategory === 'all') {
    return true;
  }

  const normalized = String(activityCategory || '').toLowerCase();

  return normalized === selectedCategory;
}

function initActivityFilters() {
  const container = document.querySelector('[data-render="page-activities"]');
  const searchInput = document.querySelector('[data-activity-search]');
  const tabs = document.querySelectorAll('.category-tab');
  const activitySection = document.querySelector('#experience-grid .experience-section');

  if (!container || activitiesData.length === 0) {
    return;
  }

  const initialQuery = new URLSearchParams(window.location.search).get('q');
  if (searchInput && initialQuery) {
    searchInput.value = initialQuery;
  }

  function activeCategory() {
    const activeTab = document.querySelector('.category-tab.active');
    return activeTab ? activeTab.dataset.category : 'all';
  }

  function renderFilteredActivities() {
    const filtered = filterActivities(activitiesData, {
      query: searchInput ? searchInput.value : '',
      category: activeCategory(),
    });

    if (activitySection) {
      activitySection.style.display = 'block';
    }

    if (filtered.length === 0) {
      renderNoResults(container, 'No activities found. Try a different search or category.');
      return;
    }

    renderActivityCards(filtered, container);
    refreshAOS();
  }

  if (searchInput) {
    searchInput.addEventListener('input', renderFilteredActivities);
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', function () {
      tabs.forEach((item) => {
        item.classList.remove('active', 'bg-green-800', 'text-white');
        item.classList.add('bg-gray-100', 'hover:bg-gray-200');
      });
      this.classList.add('active', 'bg-green-800', 'text-white');
      this.classList.remove('bg-gray-100', 'hover:bg-gray-200');
      renderFilteredActivities();
    });
  });

  if (initialQuery) {
    renderFilteredActivities();
  }
}

function initAccommodationFilters(data, container) {
  if (!container || !Array.isArray(data) || data.length === 0) {
    return;
  }

  const searchInput = document.querySelector('[data-accommodation-search]');
  const citySelect = document.querySelector('[data-accommodation-city-filter]');
  const priceButtons = document.querySelectorAll('[data-price]');

  if (citySelect && citySelect.options.length <= 1) {
    const cities = Array.from(
      new Set(
        data
          .flatMap((accommodation) => String(accommodation.city || '').split(/,| and /i))
          .map((city) => city.trim().replace(/^and\s+/i, ''))
          .filter(Boolean)
      )
    ).sort();
    citySelect.insertAdjacentHTML(
      'beforeend',
      cities
        .map((city) => `<option value="${escapeHTML(city)}">${escapeHTML(city)}</option>`)
        .join('')
    );
  }

  function renderFilteredAccommodations() {
    const query = String(searchInput ? searchInput.value : '')
      .trim()
      .toLowerCase();
    const city = citySelect ? citySelect.value : 'all';
    const activePrice = document.querySelector('[data-price].category-active');
    const price = activePrice ? activePrice.dataset.price : 'all';
    const filtered = data.filter((accommodation) => {
      const searchable = [
        accommodation.name,
        accommodation.city,
        accommodation.type,
        accommodation.shortDescription,
        accommodation.longDescription,
        ...(Array.isArray(accommodation.tags) ? accommodation.tags : []),
      ]
        .join(' ')
        .toLowerCase();
      const cities = String(accommodation.city || '')
        .split(/,| and /i)
        .map((value) =>
          value
            .trim()
            .replace(/^and\s+/i, '')
            .toLowerCase()
        );

      return (
        (!query || searchable.includes(query)) &&
        (city === 'all' || cities.includes(city.toLowerCase())) &&
        (price === 'all' || accommodation.priceRange === price)
      );
    });

    if (filtered.length === 0) {
      renderNoResults(container, 'No places to stay found. Try a different search or filter.');
      return;
    }

    renderAccommodationCards(filtered, container);
  }

  if (searchInput) {
    searchInput.addEventListener('input', renderFilteredAccommodations);
  }
  if (citySelect) {
    citySelect.addEventListener('change', renderFilteredAccommodations);
  }
  priceButtons.forEach((button) => {
    button.addEventListener('click', () => {
      priceButtons.forEach((item) => item.classList.remove('category-active'));
      button.classList.add('category-active');
      renderFilteredAccommodations();
    });
  });
}

function refreshAOS() {
  if (typeof AOS !== 'undefined' && typeof AOS.refresh === 'function') {
    AOS.refresh();
  }
}

async function initDynamicContent() {
  const homeDestinationsContainer = document.querySelector('[data-render="home-destinations"]');
  const pageDestinationsContainer = document.querySelector('[data-render="page-destinations"]');
  const homeActivitiesContainer = document.querySelector('[data-render="home-activities"]');
  const pageActivitiesContainer = document.querySelector('[data-render="page-activities"]');
  const homeAccommodationsContainer = document.querySelector('[data-render="home-accommodations"]');
  const pageAccommodationsContainer = document.querySelector('[data-render="page-accommodations"]');

  const tasks = [];

  if (homeDestinationsContainer || pageDestinationsContainer) {
    renderLoading(homeDestinationsContainer, 'Loading destinations...');
    renderLoading(pageDestinationsContainer, 'Loading destinations...');
    tasks.push(
      fetchJSON(getDataPath('destinations.json'))
        .then((data) => {
          destinationsData = Array.isArray(data) ? data : [];
          renderDestinationCards(data, homeDestinationsContainer);
          renderDestinationCards(data, pageDestinationsContainer);
        })
        .catch((error) => {
          console.error('Failed to load destinations.json:', error);
          renderError(
            homeDestinationsContainer,
            'Destinations could not load. Please try again later.'
          );
          renderError(
            pageDestinationsContainer,
            'Destinations could not load. Please try again later.'
          );
        })
    );
  }

  if (homeActivitiesContainer || pageActivitiesContainer) {
    renderLoading(homeActivitiesContainer, 'Loading activities...');
    renderLoading(pageActivitiesContainer, 'Loading activities...');
    tasks.push(
      fetchJSON(getDataPath('activities.json'))
        .then((data) => {
          activitiesData = Array.isArray(data) ? data : [];
          renderActivityCards(data, homeActivitiesContainer);
          renderActivityCards(data, pageActivitiesContainer);
        })
        .catch((error) => {
          console.error('Failed to load activities.json:', error);
          renderError(
            homeActivitiesContainer,
            'Activities could not load. Please try again later.'
          );
          renderError(
            pageActivitiesContainer,
            'Activities could not load. Please try again later.'
          );
        })
    );
  }

  if (homeAccommodationsContainer || pageAccommodationsContainer) {
    renderLoading(homeAccommodationsContainer, 'Loading accommodation ideas...');
    renderLoading(pageAccommodationsContainer, 'Loading places to stay...');
    tasks.push(
      fetchJSON(getDataPath('accommodations.json'))
        .then((data) => {
          renderAccommodationCards(data, homeAccommodationsContainer);
          renderAccommodationCards(data, pageAccommodationsContainer);
          initAccommodationFilters(data, pageAccommodationsContainer);
        })
        .catch((error) => {
          console.error('Failed to load accommodations.json:', error);
          renderError(
            homeAccommodationsContainer,
            'Accommodation cards could not load. Please try again later.'
          );
          renderError(
            pageAccommodationsContainer,
            'Accommodation cards could not load. Please try again later.'
          );
        })
    );
  }

  await Promise.all(tasks);
  initDestinationFilters();
  initActivityFilters();
  refreshAOS();
}

function initResponsiveNav() {
  const sidebar = document.querySelector('[data-mobile-sidebar]');
  const openButton = document.querySelector('[data-nav-open]');
  const closeButton = document.querySelector('[data-nav-close]');
  const backdrop = document.querySelector('[data-nav-backdrop]');
  const sidebarLinks = document.querySelectorAll('[data-nav-link]');

  if (!sidebar || !openButton || !closeButton || !backdrop) {
    return;
  }

  function openMenu() {
    document.body.classList.add('nav-open');
    sidebar.setAttribute('aria-hidden', 'false');
    openButton.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    document.body.classList.remove('nav-open');
    sidebar.setAttribute('aria-hidden', 'true');
    openButton.setAttribute('aria-expanded', 'false');
  }

  openButton.addEventListener('click', openMenu);
  closeButton.addEventListener('click', closeMenu);
  backdrop.addEventListener('click', closeMenu);

  sidebarLinks.forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeMenu();
    }
  });
}

function injectAdvisorWidget() {
  if (!document.body || !document.head || typeof document.createElement !== 'function') {
    return;
  }

  if (document.querySelector('[data-advisor-widget]')) {
    return;
  }

  const assetPrefix = isPagesDirectory() ? '../' : '';
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = `${assetPrefix}css/advisor.css`;
  stylesheet.dataset.advisorStyles = 'true';
  document.head.appendChild(stylesheet);

  const widget = document.createElement('div');
  widget.className = 'advisor-widget';
  widget.dataset.advisorWidget = 'true';
  widget.innerHTML = `
    <button class="advisor-launcher" type="button" aria-label="Open AI Trip Advisor" aria-controls="advisorPanel" aria-expanded="false" data-advisor-open>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5 8 8 0 0 1-3.3-.7L4 20l1.7-4.5A7.5 7.5 0 1 1 20 11.5Z"/><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01"/></svg>
    </button>
    <section class="advisor-widget-panel" id="advisorPanel" role="dialog" aria-labelledby="advisorPanelTitle" aria-live="polite" hidden>
      <header class="advisor-widget-header">
        <div><h2 id="advisorPanelTitle">Jordan Trip Advisor</h2><p>Personalized ideas from our listings</p></div>
        <button type="button" class="advisor-widget-close" aria-label="Close Trip Advisor" data-advisor-close>×</button>
      </header>
      <div class="advisor-chat" id="advisorChat" aria-live="polite" aria-relevant="additions text"></div>
      <form class="advisor-composer" id="advisorComposer" hidden>
        <label class="sr-only" for="advisorMessageInput">Ask a Jordan travel question</label>
        <input id="advisorMessageInput" name="message" type="text" maxlength="1000" placeholder="Ask a follow-up question..." autocomplete="off" disabled>
        <button type="submit" class="advisor-submit gold-accent" disabled>Send</button>
      </form>
    </section>
  `;

  const pageMount = document.querySelector('[data-advisor-page-mount]');
  if (pageMount) {
    const panel = widget.querySelector('.advisor-widget-panel');
    panel.classList.add('advisor-widget-panel--page');
    pageMount.appendChild(panel);
  }
  document.body.appendChild(widget);

  const rulesScript = document.createElement('script');
  rulesScript.src = `${assetPrefix}js/advisor-rules.js`;
  rulesScript.dataset.advisorModule = 'rules';
  rulesScript.onload = () => {
    const advisorScript = document.createElement('script');
    advisorScript.src = `${assetPrefix}js/advisor.js`;
    advisorScript.dataset.advisorModule = 'chat';
    document.body.appendChild(advisorScript);
  };
  document.body.appendChild(rulesScript);
}

injectAdvisorWidget();

document.addEventListener('DOMContentLoaded', async function () {
  initResponsiveNav();
  initLanguageToggle();
  initFavorites();
  initTripPlanner();
  initMap();
  initFadeAnimations();
  initHeroSlider();
  initFeaturedSlider();
  initCitySlider();
  initPageInteractions();
  await initAttractionDetailPage();
  await initDynamicContent();
  initCarousel();
  initExperienceCards();
});
