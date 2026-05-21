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

  if (!carousel || typeof $ === 'undefined' || !$.fn.owlCarousel) {
    return;
  }

  $('.custom-carousel').owlCarousel({
    autoWidth: true,
    loop: true
  });

  $('.custom-carousel .item').on('click', function() {
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

document.addEventListener('DOMContentLoaded', function() {
  initResponsiveNav();
  initMap();
  initFadeAnimations();
  initLanguageSwitcher();
  initHeroSlider();
  initCarousel();
  initExperienceCards();
});
