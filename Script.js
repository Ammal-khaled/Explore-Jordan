document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing language system...');

  // 1. Initialize Map
  const map = L.map('map').setView([30.5852, 36.2384], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // 2. Map Markers
  const markersData = [
    { name: "Petra", name_ar: "البتراء", lat: 30.3285, lng: 35.4444 },
    { name: "Wadi Rum", name_ar: "وادي رم", lat: 29.5739, lng: 35.4214 },
    { name: "Dead Sea", name_ar: "البحر الميت", lat: 31.5590, lng: 35.4732 },
    { name: "Amman", name_ar: "عمّان", lat: 31.9539, lng: 35.9106 },
    { name: "Aqaba", name_ar: "العقبة", lat: 29.5328, lng: 35.0063 }
  ];

  let mapMarkers = [];

  function updateMarkers(lang) {
    mapMarkers.forEach(marker => map.removeLayer(marker));
    mapMarkers = markersData.map(data => {
      return L.marker([data.lat, data.lng])
        .addTo(map)
        .bindPopup(lang === 'ar' ? data.name_ar : data.name);
    });
  }

  // 3. Animation System
  const animateOnScroll = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
      }
    });
  }, { threshold: 0.1 });

  // 4. Language Management
  function setLanguage(lang) {
    console.log(`Setting language to ${lang}`);
    document.getElementById('lang-en').classList.toggle('hidden', lang === 'ar');
document.getElementById('lang-ar').classList.toggle('hidden', lang === 'en');
    
    // Update HTML attributes
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    // Update map title
    const mapTitle = document.getElementById('map-title');
    if (mapTitle) {
      mapTitle.textContent = lang === 'ar' 
        ? 'استكشف الأردن على الخريطة' 
        : 'Explore Jordan on the Map';
    }
    
    // Update markers
    updateMarkers(lang);
    
    // Trigger animations for visible content
    const activeSection = document.getElementById(`lang-${lang}`);
    activeSection.querySelectorAll('.fade-in').forEach(el => {
      animateOnScroll.observe(el);
      setTimeout(() => el.classList.add('show'), 10);
    });
  }

  // 5. Event Listeners
  function setupLanguageSwitcher() {
    const switcher = document.getElementById('language-switcher');
    if (!switcher) {
      console.error('Language switcher button not found!');
      return;
    }

    let currentLang = document.documentElement.lang || 'en';
    
    switcher.addEventListener('click', function() {
      currentLang = currentLang === 'en' ? 'ar' : 'en';
      setLanguage(currentLang);
    });
  }

  // 6. Initialization
  function initialize() {
    // Set up animations
    document.querySelectorAll('.fade-in').forEach(el => {
      animateOnScroll.observe(el);
    });

    // Set up language switcher
    setupLanguageSwitcher();

    // Initialize language
    const initialLang = document.documentElement.lang || 'en';
    setLanguage(initialLang);

    // Initial animations
    setTimeout(() => {
      document.querySelectorAll(`#lang-${initialLang} .fade-in`).forEach(el => {
        el.classList.add('show');
      });
    }, 100);
  }

  initialize();
});
document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".hero-slide");
  let currentSlide = 0;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === index);
    });
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  }

  showSlide(currentSlide);
  setInterval(nextSlide, 2500);
});

  $(document).ready(function () {
    $(".custom-carousel").owlCarousel({
      autoWidth: true,
      loop: true
    });

    $(".custom-carousel .item").click(function () {
      $(".custom-carousel .item").not($(this)).removeClass("active");
      $(this).toggleClass("active");
    });
  });



$(document).ready(function(){
  // Initialize Owl Carousel with responsive settings
  $('.owl-carousel').owlCarousel({
    loop: false,
    margin: 20,
    nav: false,
    dots: true,
    responsive:{
      0: {
        items: 1,
        center: true,
        stagePadding: 20
      },
      768: {
        items: 2
      },
      1024: {
        items: 3
      }
    }
  });

  // Fade-in animation for sections
  const fadeElements = document.querySelectorAll('.fade-in');
  
  const fadeInOnScroll = function() {
    fadeElements.forEach(element => {
      const elementTop = element.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      
      if (elementTop < windowHeight - 100) {
        element.classList.add('show');
      }
    });
  };
  
  // Run once on load
  fadeInOnScroll();
  
  // Run on scroll
  window.addEventListener('scroll', fadeInOnScroll);
});
// Interactive Experience Cards
document.addEventListener('DOMContentLoaded', function() {
  const options = document.querySelectorAll('.option');
  
  options.forEach(option => {
    option.addEventListener('click', function() {
      // Remove active class from all options
      options.forEach(opt => opt.classList.remove('active'));
      
      // Add active class to clicked option
      this.classList.add('active');
    });
  });
  
  // Initialize the first option as active if none are active
  if (document.querySelectorAll('.option.active').length === 0 && options.length > 0) {
    options[0].classList.add('active');
  }
});
$(document).ready(function(){
  $('.owl-carousel').owlCarousel({
    center: true,
    items: 3,
    loop: true,
    margin: 20,
    nav: true,
    responsive: {
      0: {
        items: 1
      },
      768: {
        items: 2
      },
      1024: {
        items: 3
      }
    }
  });
});