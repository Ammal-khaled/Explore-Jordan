let jordanMap = null;
let mapMarkers = [];
let fadeObserver = null;
let destinationsData = [];
let activitiesData = [];

const markersData = [
  { name: "Petra", name_ar: "\u0627\u0644\u0628\u062a\u0631\u0627\u0621", lat: 30.3285, lng: 35.4444 },
  { name: "Wadi Rum", name_ar: "\u0648\u0627\u062f\u064a \u0631\u0645", lat: 29.5739, lng: 35.4214 },
  { name: "Dead Sea", name_ar: "\u0627\u0644\u0628\u062d\u0631 \u0627\u0644\u0645\u064a\u062a", lat: 31.5590, lng: 35.4732 },
  { name: "Amman", name_ar: "\u0639\u0645\u0651\u0627\u0646", lat: 31.9539, lng: 35.9106 },
  { name: "Aqaba", name_ar: "\u0627\u0644\u0639\u0642\u0628\u0629", lat: 29.5328, lng: 35.0063 }
];

const activityIcons = {
  'hiking-in-dana': 'fa-hiking',
  'diving-in-aqaba': 'fa-swimmer',
  'hot-air-ballooning-wadi-rum': 'fa-mountain-sun',
  'camel-trekking': 'fa-horse',
  'petra-by-night': 'fa-moon',
  'dead-sea-floating': 'fa-water',
  'jerash-ruins-tour': 'fa-landmark',
  'wadi-rum-jeep-tour': 'fa-car'
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
  if (!path || /^(https?:)?\/\//.test(path) || path.startsWith('/') || path.startsWith('../')) {
    return path;
  }

  return isPagesDirectory() ? `../${path}` : path;
}

function getAttractionDetailPath(destination) {
  const id = destination.id || destination.slug;
  const filePath = isPagesDirectory() ? 'attraction.html' : 'pages/attraction.html';
  return `${filePath}?id=${encodeURIComponent(id)}`;
}

function escapeHTML(value) {
  return String(value || '').replace(/[&<>"']/g, character => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
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
  return getFavorites().some(favorite => favorite.type === type && favorite.id === id);
}

function toggleFavorite(type, id) {
  const favorites = getFavorites();
  const existingIndex = favorites.findIndex(favorite => favorite.type === type && favorite.id === id);

  if (existingIndex >= 0) {
    favorites.splice(existingIndex, 1);
  } else {
    favorites.push({ type, id });
  }

  saveFavorites(favorites);
  updateFavoriteButtons();
}

function updateFavoriteButtons() {
  document.querySelectorAll('[data-favorite-type][data-favorite-id]').forEach(button => {
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
  const exists = items.some(savedItem => savedItem.type === item.type && savedItem.id === item.id);

  if (!exists) {
    items.push(item);
    saveTripItems(items);
  }

  updateTripButtons();
  renderTripPlanner();
}

function removeFromTrip(type, id) {
  const items = getTripItems().filter(item => !(item.type === type && item.id === id));
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
  return getTripItems().some(item => item.type === type && item.id === id);
}

function updateTripButtons() {
  document.querySelectorAll('[data-trip-type][data-trip-id]').forEach(button => {
    const active = isInTrip(button.dataset.tripType, button.dataset.tripId);
    button.classList.toggle('trip-button--active', active);
    button.setAttribute('aria-pressed', String(active));
    button.textContent = active ? 'Added to Trip' : 'Add to Trip';
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
    aria-pressed="false">Add to Trip</button>`;
}

function destinationTripItem(destination) {
  return {
    id: destination.id,
    type: 'destination',
    name: destination.name,
    location: destination.city,
    image: destination.image,
    category: destination.category
  };
}

function activityTripItem(activity) {
  return {
    id: activity.id,
    type: 'activity',
    name: activity.name,
    location: activity.location,
    image: activity.image,
    category: activity.category
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

  const skeletonCount = container.classList.contains('custom-carousel') || container.classList.contains('options') ? 4 : 3;
  const skeletons = Array.from({ length: skeletonCount }, () => '<span class="loading-skeleton-card"></span>').join('');
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
  const categories = new Set((destination.tags || []).map(tag => String(tag).toLowerCase().replace(/\s+/g, '-')));
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

  if (category.includes('desert') || (destination.tags || []).some(tag => String(tag).toLowerCase().includes('adventure'))) {
    categories.add('adventure');
  }

  return Array.from(categories).join(',');
}

function tagList(tags) {
  return (tags || []).slice(0, 3).map(tag => {
    return `<span class="text-xs px-2 py-1 bg-gray-100 rounded-full">${escapeHTML(tag)}</span>`;
  }).join('');
}

function destinationSearchText(destination) {
  return normalizeText([
    destination.name,
    destination.city,
    destination.category,
    destination.shortDescription,
    destination.longDescription,
    ...(destination.tags || [])
  ].join(' '));
}

function activitySearchText(activity) {
  return normalizeText([
    activity.name,
    activity.location,
    activity.category,
    activity.shortDescription,
    activity.longDescription,
    ...(activity.tags || [])
  ].join(' '));
}

function sharesDestinationContext(destination, activity) {
  const destinationTerms = [
    destination.name,
    destination.city,
    destination.category,
    ...(destination.tags || [])
  ].map(normalizeText).filter(Boolean);

  const activityTerms = [
    activity.name,
    activity.location,
    activity.category,
    ...(activity.tags || [])
  ].map(normalizeText).filter(Boolean);

  return destinationTerms.some(destinationTerm => {
    return activityTerms.some(activityTerm => {
      return destinationTerm === activityTerm ||
        destinationTerm.includes(activityTerm) ||
        activityTerm.includes(destinationTerm);
    });
  });
}

function filterDestinations(data, filters = {}) {
  const query = normalizeText(filters.query);
  const category = normalizeText(filters.category || 'all');
  const city = normalizeText(filters.city || 'all');

  return (Array.isArray(data) ? data : []).filter(destination => {
    const destinationCategory = normalizeText(destination.category);
    const categories = destinationCategories(destination).split(',').map(normalizeText);
    const matchesQuery = !query || destinationSearchText(destination).includes(query);
    const matchesCategory = category === 'all' || destinationCategory === category || categories.includes(category);
    const matchesCity = city === 'all' || normalizeText(destination.city) === city;

    return matchesQuery && matchesCategory && matchesCity;
  });
}

function filterActivities(data, filters = {}) {
  const query = normalizeText(filters.query);
  const category = normalizeText(filters.category || 'all');

  return (Array.isArray(data) ? data : []).filter(activity => {
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
    container.innerHTML = data.map((destination, index) => `
      <div class="item${index === 0 ? ' active' : ''}" style="background-image: url('${resolveAssetPath(destination.image)}');">
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
    `).join('');
    updateFavoriteButtons();
    updateTripButtons();
    return;
  }

  container.innerHTML = data.map(destination => `
    <div class="destination-card" data-categories="${escapeHTML(destinationCategories(destination))}">
      <div class="bg-white rounded-xl overflow-hidden shadow-lg card-hover h-full">
        <div class="relative">
          <img src="${resolveAssetPath(destination.image)}" alt="${escapeHTML(destination.name)}" class="w-full h-48 object-cover">
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
            <a href="${escapeHTML(destination.mapLink)}" target="_blank" rel="noopener" class="inline-block gold-accent text-white font-semibold px-4 py-2 rounded-full hover:bg-yellow-600 transition flex-1 text-center">
              <i class="fas fa-map-marker-alt mr-2"></i> View Map
            </a>
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
  `).join('');
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
    container.innerHTML = data.map((activity, index) => `
      <div class="option${index === 0 ? ' active' : ''}" style="--optionBackground:url('${resolveAssetPath(activity.image)}')">
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
    `).join('');
    updateFavoriteButtons();
    updateTripButtons();
    return;
  }

  container.innerHTML = data.map((activity, index) => `
    <div class="experience-card bg-white rounded-xl overflow-hidden" data-category="${escapeHTML(String(activity.category || '').toLowerCase())}" data-aos="fade-up" data-aos-delay="${100 + (index % 3) * 100}">
      <div class="relative">
        <img src="${resolveAssetPath(activity.image)}" alt="${escapeHTML(activity.name)}" class="w-full h-64 object-cover">
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
          <a href="${escapeHTML(activity.mapLink)}" target="_blank" rel="noopener" class="text-green-700 hover:text-green-800 font-semibold hover-grow">View Map</a>
        </div>
        <div class="mt-4">
          ${tripButtonMarkup(activityTripItem(activity))}
        </div>
      </div>
    </div>
  `).join('');
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

  container.innerHTML = data.map(accommodation => `
    <div class="card-shadow bg-white rounded-lg overflow-hidden">
      <img src="${resolveAssetPath(accommodation.image)}" alt="${escapeHTML(accommodation.name)}" class="w-full h-48 object-cover">
      <div class="p-4">
        <div class="flex flex-wrap gap-2 mb-3">
          ${tagList(accommodation.tags)}
        </div>
        <h3 class="font-bold text-xl mb-2">${escapeHTML(accommodation.name)}</h3>
        <p>${escapeHTML(accommodation.shortDescription)}</p>
      </div>
    </div>
  `).join('');
}

function renderAttractionDetail(destination, relatedActivities, container) {
  const tags = (destination.tags || []).map(tag => `<span>${escapeHTML(tag)}</span>`).join('');
  const tripItem = destinationTripItem(destination);
  const relatedMarkup = relatedActivities.length > 0
    ? `<div class="attraction-related-grid">${relatedActivities.map(activity => `
        <article class="attraction-related-card">
          <img src="${resolveAssetPath(activity.image)}" alt="${escapeHTML(activity.name)}">
          <div>
            <p>${escapeHTML(activity.category)} | ${escapeHTML(activity.duration)}</p>
            <h3>${escapeHTML(activity.name)}</h3>
            <span>${escapeHTML(activity.shortDescription)}</span>
          </div>
        </article>
      `).join('')}</div>`
    : '<p class="attraction-muted">No closely related activities are listed yet.</p>';

  container.innerHTML = `
    <article class="attraction-detail-card">
      <a class="attraction-back" href="top.html">Back to Top Destinations</a>
      <div class="attraction-hero-image">
        <img src="${resolveAssetPath(destination.image)}" alt="${escapeHTML(destination.name)}">
      </div>
      <div class="attraction-content">
        <p class="attraction-meta">${escapeHTML(destination.city)} | ${escapeHTML(destination.category)}</p>
        <h1>${escapeHTML(destination.name)}</h1>
        <p>${escapeHTML(destination.longDescription || destination.shortDescription)}</p>
        <div class="attraction-tags">${tags}</div>
        <div class="attraction-actions">
          <a href="${escapeHTML(destination.mapLink)}" target="_blank" rel="noopener" class="button-78">View Map</a>
          <a href="${escapeHTML(destination.officialLink)}" target="_blank" rel="noopener" class="button-78 attraction-secondary-action">Official Link</a>
          ${tripButtonMarkup(tripItem, 'trip-button--detail')}
        </div>
      </div>
    </article>
    <section class="attraction-related">
      <h2>Related Activities</h2>
      ${relatedMarkup}
    </section>
  `;
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
      ${items.map(item => `
        <article class="trip-card">
          <img src="${resolveAssetPath(item.image)}" alt="${escapeHTML(item.name)}">
          <div class="trip-card__body">
            <span>${escapeHTML(item.type)} | ${escapeHTML(item.category)}</span>
            <h3>${escapeHTML(item.name)}</h3>
            <p>${escapeHTML(item.location)}</p>
            <button class="trip-remove-button" type="button" data-trip-remove data-trip-type="${escapeHTML(item.type)}" data-trip-id="${escapeHTML(item.id)}">Remove</button>
          </div>
        </article>
      `).join('')}
    </div>
  `;
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
    renderError(container, 'Choose a destination from the Top Destinations page to view its details.');
    return;
  }

  try {
    const [destinations, activities] = await Promise.all([
      fetchJSON(getDataPath('destinations.json')),
      fetchJSON(getDataPath('activities.json'))
    ]);
    const destination = (destinations || []).find(item => {
      return normalizeText(item.id) === destinationId || normalizeText(item.slug) === destinationId;
    });

    if (!destination) {
      renderError(container, 'We could not find that destination. Please return to Top Destinations and choose another place.');
      return;
    }

    document.title = `${destination.name} | Explore Jordan`;
    const relatedActivities = (activities || [])
      .filter(activity => sharesDestinationContext(destination, activity))
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
    attribution: 'Map data &copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(jordanMap);
}

function updateMarkers(lang) {
  if (!jordanMap) {
    return;
  }

  mapMarkers.forEach(marker => jordanMap.removeLayer(marker));
  mapMarkers = markersData.map(data => {
    return L.marker([data.lat, data.lng])
      .addTo(jordanMap)
      .bindPopup(lang === 'ar' ? data.name_ar : data.name);
  });
}

function setLanguage(lang) {
  const englishSection = document.getElementById('lang-en');
  const arabicSection = document.getElementById('lang-ar');

  if (englishSection) {
    englishSection.classList.toggle('hidden', lang === 'ar');
  }

  if (arabicSection) {
    arabicSection.classList.toggle('hidden', lang === 'en');
  }

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  const mapTitle = document.getElementById('map-title');
  if (mapTitle) {
    mapTitle.textContent = lang === 'ar'
      ? '\u0627\u0633\u062a\u0643\u0634\u0641 \u0627\u0644\u0623\u0631\u062f\u0646 \u0639\u0644\u0649 \u0627\u0644\u062e\u0631\u064a\u0637\u0629'
      : 'Explore Jordan on the Map';
  }

  updateMarkers(lang);

  const activeSection = document.getElementById(`lang-${lang}`);
  if (activeSection && fadeObserver) {
    activeSection.querySelectorAll('.fade-in').forEach(element => {
      fadeObserver.observe(element);
      setTimeout(() => element.classList.add('show'), 10);
    });
  }
}

function initLanguageSwitcher() {
  const switcher = document.getElementById('language-switcher');
  const englishSection = document.getElementById('lang-en');
  const arabicSection = document.getElementById('lang-ar');

  if (!englishSection && !arabicSection) {
    return;
  }

  let currentLang = document.documentElement.lang || 'en';

  if (!switcher || !englishSection || !arabicSection) {
    setLanguage(currentLang);
    return;
  }

  switcher.addEventListener('click', function() {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
    setLanguage(currentLang);
  });

  setLanguage(currentLang);
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

  if (!carousel || !carousel.querySelector('.item') || typeof $ === 'undefined' || !$.fn.owlCarousel) {
    return;
  }

  const $carousel = $('.custom-carousel');

  if ($carousel.data('owl.carousel')) {
    $carousel.trigger('destroy.owl.carousel');
    $carousel.removeClass('owl-loaded owl-hidden');
    $carousel.find('.owl-stage-outer').children().unwrap();
  }

  $carousel.owlCarousel({
    autoWidth: true,
    loop: true
  });

  $('.custom-carousel .item').off('click').on('click', function() {
    $('.custom-carousel .item').not($(this)).removeClass('active');
    $(this).toggleClass('active');
  });
}

function initFadeAnimations() {
  const fadeElements = document.querySelectorAll('.fade-in');

  if (fadeElements.length === 0) {
    return;
  }

  fadeObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
      }
    });
  }, { threshold: 0.1 });

  fadeElements.forEach(element => {
    fadeObserver.observe(element);
  });

  const initialLang = document.documentElement.lang || 'en';
  setTimeout(() => {
    document.querySelectorAll(`#lang-${initialLang} .fade-in`).forEach(element => {
      element.classList.add('show');
    });
  }, 100);
}

function initExperienceCards() {
  const options = document.querySelectorAll('.option');

  if (options.length === 0) {
    return;
  }

  options.forEach(option => {
    option.addEventListener('click', function() {
      options.forEach(item => item.classList.remove('active'));
      this.classList.add('active');
    });
  });

  if (document.querySelectorAll('.option.active').length === 0) {
    options[0].classList.add('active');
  }
}

function initFavorites() {
  document.addEventListener('click', function(event) {
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
  document.addEventListener('click', function(event) {
    const addButton = event.target.closest('[data-trip-type][data-trip-id]:not([data-trip-remove])');
    const removeButton = event.target.closest('[data-trip-remove]');
    const clearButton = event.target.closest('[data-trip-clear]');

    if (addButton) {
      event.preventDefault();
      event.stopPropagation();
      addToTrip({
        id: addButton.dataset.tripId,
        type: addButton.dataset.tripType,
        name: addButton.dataset.tripName,
        location: addButton.dataset.tripLocation,
        image: addButton.dataset.tripImage,
        category: addButton.dataset.tripCategory
      });
      return;
    }

    if (removeButton) {
      event.preventDefault();
      removeFromTrip(removeButton.dataset.tripType, removeButton.dataset.tripId);
      return;
    }

    if (clearButton) {
      event.preventDefault();
      clearTrip();
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
    const cities = Array.from(new Set(destinationsData.map(destination => destination.city).filter(Boolean))).sort();
    citySelect.insertAdjacentHTML('beforeend', cities.map(city => {
      return `<option value="${escapeHTML(city)}">${escapeHTML(city)}</option>`;
    }).join(''));
  }

  function activeCategory() {
    const activeButton = document.querySelector('.filter-btn.category-active');
    return activeButton ? activeButton.getAttribute('data-category') : 'all';
  }

  function renderFilteredDestinations() {
    const filtered = filterDestinations(destinationsData, {
      query: searchInput ? searchInput.value : '',
      category: activeCategory(),
      city: citySelect ? citySelect.value : 'all'
    });

    if (filtered.length === 0) {
      renderNoResults(container, 'No destinations found. Try a different search, category, or city.');
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

  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      filterButtons.forEach(item => {
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

  function activeCategory() {
    const activeTab = document.querySelector('.category-tab.active');
    return activeTab ? activeTab.dataset.category : 'all';
  }

  function renderFilteredActivities() {
    const filtered = filterActivities(activitiesData, {
      query: searchInput ? searchInput.value : '',
      category: activeCategory()
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

  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      tabs.forEach(item => {
        item.classList.remove('active', 'bg-green-800', 'text-white');
        item.classList.add('bg-gray-100', 'hover:bg-gray-200');
      });
      this.classList.add('active', 'bg-green-800', 'text-white');
      this.classList.remove('bg-gray-100', 'hover:bg-gray-200');
      renderFilteredActivities();
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

  const tasks = [];

  if (homeDestinationsContainer || pageDestinationsContainer) {
    renderLoading(homeDestinationsContainer, 'Loading destinations...');
    renderLoading(pageDestinationsContainer, 'Loading destinations...');
    tasks.push(fetchJSON(getDataPath('destinations.json'))
      .then(data => {
        destinationsData = Array.isArray(data) ? data : [];
        renderDestinationCards(data, homeDestinationsContainer);
        renderDestinationCards(data, pageDestinationsContainer);
      })
      .catch(error => {
        console.error('Failed to load destinations.json:', error);
        renderError(homeDestinationsContainer, 'Destinations could not load. Please try again later.');
        renderError(pageDestinationsContainer, 'Destinations could not load. Please try again later.');
      }));
  }

  if (homeActivitiesContainer || pageActivitiesContainer) {
    renderLoading(homeActivitiesContainer, 'Loading activities...');
    renderLoading(pageActivitiesContainer, 'Loading activities...');
    tasks.push(fetchJSON(getDataPath('activities.json'))
      .then(data => {
        activitiesData = Array.isArray(data) ? data : [];
        renderActivityCards(data, homeActivitiesContainer);
        renderActivityCards(data, pageActivitiesContainer);
      })
      .catch(error => {
        console.error('Failed to load activities.json:', error);
        renderError(homeActivitiesContainer, 'Activities could not load. Please try again later.');
        renderError(pageActivitiesContainer, 'Activities could not load. Please try again later.');
      }));
  }

  if (homeAccommodationsContainer) {
    renderLoading(homeAccommodationsContainer, 'Loading accommodation ideas...');
    tasks.push(fetchJSON(getDataPath('accommodations.json'))
      .then(data => renderAccommodationCards(data, homeAccommodationsContainer))
      .catch(error => {
        console.error('Failed to load accommodations.json:', error);
        renderError(homeAccommodationsContainer, 'Accommodation cards could not load. Please try again later.');
      }));
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

  sidebarLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeMenu();
    }
  });
}

document.addEventListener('DOMContentLoaded', async function() {
  initResponsiveNav();
  initFavorites();
  initTripPlanner();
  initMap();
  initFadeAnimations();
  initLanguageSwitcher();
  initHeroSlider();
  await initAttractionDetailPage();
  await initDynamicContent();
  initCarousel();
  initExperienceCards();
});

