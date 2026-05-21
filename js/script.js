let jordanMap = null;
let mapMarkers = [];
let fadeObserver = null;

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

async function fetchJSON(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
  }

  return response.json();
}

function showEmptyState(container, message) {
  container.innerHTML = `<p class="empty-state">${escapeHTML(message)}</p>`;
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

function renderDestinationCards(data, container) {
  if (!container) {
    return;
  }

  if (!Array.isArray(data) || data.length === 0) {
    showEmptyState(container, 'No destination cards are available right now.');
    return;
  }

  const isCarousel = container.classList.contains('custom-carousel');

  if (isCarousel) {
    container.innerHTML = data.map((destination, index) => `
      <div class="item${index === 0 ? ' active' : ''}" style="background-image: url('${resolveAssetPath(destination.image)}');">
        <div class="item-title">
          <h3>${escapeHTML(destination.name)}</h3>
        </div>
        <div class="item-desc">
          <p>${escapeHTML(destination.shortDescription)}</p>
        </div>
      </div>
    `).join('');
    return;
  }

  container.innerHTML = data.map(destination => `
    <div class="destination-card" data-categories="${escapeHTML(destinationCategories(destination))}">
      <div class="bg-white rounded-xl overflow-hidden shadow-lg card-hover h-full">
        <img src="${resolveAssetPath(destination.image)}" alt="${escapeHTML(destination.name)}" class="w-full h-48 object-cover">
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
            <a href="${escapeHTML(destination.officialLink)}" target="_blank" rel="noopener" class="inline-block border border-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-full hover:bg-gray-100 transition flex-1 text-center">
              <i class="fas fa-info-circle mr-2"></i> Details
            </a>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function renderActivityCards(data, container) {
  if (!container) {
    return;
  }

  if (!Array.isArray(data) || data.length === 0) {
    showEmptyState(container, 'No activity cards are available right now.');
    return;
  }

  const isExperienceStrip = container.classList.contains('options');

  if (isExperienceStrip) {
    container.innerHTML = data.map((activity, index) => `
      <div class="option${index === 0 ? ' active' : ''}" style="--optionBackground:url('${resolveAssetPath(activity.image)}')">
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
    return;
  }

  container.innerHTML = data.map((activity, index) => `
    <div class="experience-card bg-white rounded-xl overflow-hidden" data-category="${escapeHTML(String(activity.category || '').toLowerCase())}" data-aos="fade-up" data-aos-delay="${100 + (index % 3) * 100}">
      <div class="relative">
        <img src="${resolveAssetPath(activity.image)}" alt="${escapeHTML(activity.name)}" class="w-full h-64 object-cover">
        <div class="absolute top-4 right-4 bg-green-800 text-white px-3 py-1 rounded-full text-sm font-semibold hover-grow">
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
      </div>
    </div>
  `).join('');
}

function renderAccommodationCards(data, container) {
  if (!container) {
    return;
  }

  if (!Array.isArray(data) || data.length === 0) {
    showEmptyState(container, 'No accommodation cards are available right now.');
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

function initDestinationFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const destinationCards = document.querySelectorAll('.destination-card');

  if (filterButtons.length === 0 || destinationCards.length === 0) {
    return;
  }

  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      const category = this.getAttribute('data-category');

      destinationCards.forEach(card => {
        const categories = (card.getAttribute('data-categories') || '').split(',');
        card.style.display = category === 'all' || categories.includes(category) ? 'block' : 'none';
      });
    });
  });
}

function activityMatchesTab(activityCategory, selectedCategory) {
  if (selectedCategory === 'all') {
    return true;
  }

  const normalized = String(activityCategory || '').toLowerCase();

  if (selectedCategory === 'cultural') {
    return ['cultural', 'history'].includes(normalized);
  }

  if (selectedCategory === 'adventure') {
    return ['adventure', 'water', 'scenic', 'wellness'].includes(normalized);
  }

  return normalized === selectedCategory;
}

function initActivityFilters() {
  const tabs = document.querySelectorAll('.category-tab');
  const activityCards = document.querySelectorAll('#activitiesContainer .experience-card');
  const activitySection = document.querySelector('#experience-grid .experience-section');

  if (tabs.length === 0 || activityCards.length === 0) {
    return;
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const category = this.dataset.category;

      if (activitySection) {
        activitySection.style.display = 'block';
      }

      activityCards.forEach(card => {
        card.style.display = activityMatchesTab(card.dataset.category, category) ? 'block' : 'none';
      });
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
    tasks.push(fetchJSON(getDataPath('destinations.json'))
      .then(data => {
        renderDestinationCards(data, homeDestinationsContainer);
        renderDestinationCards(data, pageDestinationsContainer);
      })
      .catch(() => {
        if (homeDestinationsContainer) showEmptyState(homeDestinationsContainer, 'Destinations could not load. Please try again later.');
        if (pageDestinationsContainer) showEmptyState(pageDestinationsContainer, 'Destinations could not load. Please try again later.');
      }));
  }

  if (homeActivitiesContainer || pageActivitiesContainer) {
    tasks.push(fetchJSON(getDataPath('activities.json'))
      .then(data => {
        renderActivityCards(data, homeActivitiesContainer);
        renderActivityCards(data, pageActivitiesContainer);
      })
      .catch(() => {
        if (homeActivitiesContainer) showEmptyState(homeActivitiesContainer, 'Activities could not load. Please try again later.');
        if (pageActivitiesContainer) showEmptyState(pageActivitiesContainer, 'Activities could not load. Please try again later.');
      }));
  }

  if (homeAccommodationsContainer) {
    tasks.push(fetchJSON(getDataPath('accommodations.json'))
      .then(data => renderAccommodationCards(data, homeAccommodationsContainer))
      .catch(() => showEmptyState(homeAccommodationsContainer, 'Accommodation cards could not load. Please try again later.')));
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
  initMap();
  initFadeAnimations();
  initLanguageSwitcher();
  initHeroSlider();
  await initDynamicContent();
  initCarousel();
  initExperienceCards();
});
