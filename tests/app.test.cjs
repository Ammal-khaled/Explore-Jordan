const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const projectRoot = path.join(__dirname, '..');
const scriptSource = fs.readFileSync(path.join(projectRoot, 'js/script.js'), 'utf8');
const advisorRules = require('../js/advisor-rules.js');

function loadSharedFunctions(initialStorage = {}, languageButtons = []) {
  const storage = new Map(Object.entries(initialStorage));
  const markerPopups = [];
  const document = {
    addEventListener() {},
    querySelectorAll(selector) {
      return selector === '[data-language-toggle]' ? languageButtons : [];
    },
    querySelector() {
      return null;
    },
  };
  const context = {
    document,
    localStorage: {
      getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
      },
      setItem(key, value) {
        storage.set(key, String(value));
      },
    },
    URL,
    URLSearchParams,
    markerPopups,
    L: {
      marker() {
        return {
          addTo() {
            return this;
          },
          bindPopup(content) {
            markerPopups.push(content);
            return this;
          },
        };
      },
    },
    window: {
      location: {
        pathname: '/index.html',
        href: 'https://example.test/',
      },
    },
  };

  vm.runInNewContext(
    `${scriptSource}\nglobalThis.testApi = { filterDestinations, filterActivities, getFavorites, toggleFavorite, getTripItems, addToTrip, removeFromTrip, safeHttpUrl, resolveAssetPath, initLanguageToggle, setMap(map) { jordanMap = map; }, markerPopups };`,
    context
  );

  return context.testApi;
}

function makeLanguageButton() {
  const attributes = new Map();
  const listeners = new Map();
  return {
    attributes,
    listeners,
    textContent: '',
    setAttribute(name, value) {
      attributes.set(name, value);
    },
    addEventListener(name, callback) {
      listeners.set(name, callback);
    },
  };
}

test('filterDestinations searches descriptions and applies city and category filters', () => {
  const api = loadSharedFunctions();
  const items = [
    {
      id: 'amman',
      name: 'Amman',
      city: 'Amman',
      category: 'City',
      shortDescription: 'Busy markets',
      tags: ['culture'],
    },
    {
      id: 'petra',
      name: 'Petra',
      city: 'Wadi Musa',
      category: 'Heritage',
      shortDescription: 'Ancient city',
      tags: ['history'],
    },
  ];

  assert.deepEqual(
    api.filterDestinations(items, { query: 'MARKETS', city: 'amman' }).map((item) => item.id),
    ['amman']
  );
  assert.deepEqual(
    api.filterDestinations(items, { category: 'historical' }).map((item) => item.id),
    ['petra']
  );
});

test('filterActivities searches text and applies category filters', () => {
  const api = loadSharedFunctions();
  const items = [
    {
      id: 'hike',
      name: 'Dana Hike',
      location: 'Dana',
      category: 'Adventure',
      shortDescription: 'Mountain trails',
      tags: ['hiking'],
    },
    {
      id: 'dive',
      name: 'Aqaba Dive',
      location: 'Aqaba',
      category: 'Water',
      shortDescription: 'Coral reefs',
      tags: ['sea'],
    },
  ];

  assert.deepEqual(
    api.filterActivities(items, { query: 'REEFS' }).map((item) => item.id),
    ['dive']
  );
  assert.deepEqual(
    api.filterActivities(items, { category: 'adventure' }).map((item) => item.id),
    ['hike']
  );
});

test('advisor interest matching accepts any selected tag and empty interests', () => {
  assert.equal(
    advisorRules.matchesInterests(['hiking', 'nature'], new Set(['desert', 'nature'])),
    true
  );
  assert.equal(advisorRules.matchesInterests(['history'], new Set(['nature'])), false);
  assert.equal(advisorRules.matchesInterests(['history'], new Set()), true);
});

test('advisor budget matching respects the selected ceiling', () => {
  assert.equal(advisorRules.withinBudget('$', '$$'), true);
  assert.equal(advisorRules.withinBudget('$$$', '$$'), false);
  assert.equal(advisorRules.withinBudget(undefined, '$'), true);
});

test('favorites load, toggle on, and toggle off in localStorage', () => {
  const api = loadSharedFunctions();
  assert.equal(api.getFavorites().length, 0);

  api.toggleFavorite('destination', 'petra');
  assert.equal(api.getFavorites().length, 1);
  assert.equal(api.getFavorites()[0].id, 'petra');

  api.toggleFavorite('destination', 'petra');
  assert.equal(api.getFavorites().length, 0);
});

test('favorites recover from malformed localStorage JSON', () => {
  const api = loadSharedFunctions({ exploreJordanFavorites: '{bad json' });
  assert.equal(api.getFavorites().length, 0);
});

test('trip items add once and remove by type and id', () => {
  const api = loadSharedFunctions();
  const petra = { id: 'petra', type: 'destination', name: 'Petra' };

  assert.equal(api.getTripItems().length, 0);
  api.addToTrip(petra);
  api.addToTrip(petra);
  api.addToTrip({ id: 'petra', type: 'activity', name: 'Petra by Night' });
  assert.equal(api.getTripItems().length, 2);

  api.removeFromTrip('destination', 'petra');
  assert.equal(api.getTripItems().length, 1);
  assert.equal(api.getTripItems()[0].type, 'activity');
});

test('JSON-provided links reject executable schemes and preserve HTTPS URLs', () => {
  const api = loadSharedFunctions();
  assert.equal(api.safeHttpUrl('javascript:alert(1)'), null);
  assert.equal(api.safeHttpUrl('data:text/html,unsafe'), null);
  assert.equal(api.safeHttpUrl('https://example.com/place'), 'https://example.com/place');
  assert.equal(api.resolveAssetPath('javascript:alert(1)'), 'assets/images/petra.jpg');
});

test('language toggles update every control, persist the choice, and rebuild map labels', () => {
  const buttons = [makeLanguageButton(), makeLanguageButton()];
  const api = loadSharedFunctions({}, buttons);
  api.setMap({ removeLayer() {} });
  api.initLanguageToggle();

  assert.equal(buttons[0].textContent, 'العربية');
  buttons[0].listeners.get('click')();

  assert.equal(buttons[0].textContent, 'English');
  assert.equal(buttons[1].textContent, 'English');
  assert.equal(buttons[0].attributes.get('aria-pressed'), 'true');
  assert.equal(api.markerPopups.length, 5);
  assert.ok(api.markerPopups[0].includes('\u0627\u0644\u0628\u062a\u0631\u0627\u0621'));
});
