(function () {
  const chat = document.getElementById('advisorChat');
  const panel = document.getElementById('advisorPanel');
  const launcher = document.querySelector('[data-advisor-open]');
  const closeButton = document.querySelector('[data-advisor-close]');
  const composer = document.getElementById('advisorComposer');
  const composerInput = document.getElementById('advisorMessageInput');
  const composerButton = composer?.querySelector('[type="submit"]');
  if (!chat || !panel || !launcher || !closeButton) return;

  const { normalize, withinBudget, matchesInterests } = window.ExploreJordanAdvisorRules;
  const storageKey = 'exploreJordanAdvisorConversation';
  const summaryText = 'Want to adjust anything? Start over to change your trip preferences.';
  const restartPrompt = 'Want to plan another Jordan trip?';
  const budgets = [
    { value: '$', label: '$ Budget' },
    { value: '$$', label: '$$ Mid-range' },
    { value: '$$$', label: '$$$ Comfort/Luxury' },
  ];
  const interests = [
    { value: 'history', label: 'History & Heritage' },
    { value: 'nature', label: 'Nature & Hiking' },
    { value: 'adventure', label: 'Adventure' },
    { value: 'relax', label: 'Relax & Wellness' },
    { value: 'culture', label: 'Local Culture' },
    { value: 'desert', label: 'Desert' },
  ];

  function readState() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
      if (saved && ['days', 'budget', 'interests', 'done'].includes(saved.step)) {
        return {
          open: Boolean(saved.open),
          step: saved.step,
          days: saved.days || 4,
          budget: saved.budget || '$$',
          interests: Array.isArray(saved.interests) ? saved.interests : [],
          history: Array.isArray(saved.history) ? saved.history : [],
          sessionId: typeof saved.sessionId === 'string' ? saved.sessionId : createSessionId(),
          requestCount: Number(saved.requestCount) || 0,
          lastRecommendations: Array.isArray(saved.lastRecommendations)
            ? saved.lastRecommendations
            : [],
          recommendationSets: Array.isArray(saved.recommendationSets)
            ? saved.recommendationSets
            : [],
          usedFallback: Boolean(saved.usedFallback),
          pendingAI: Boolean(saved.pendingAI),
          openingPending: Boolean(saved.openingPending),
          openingQuestionFromAI: Boolean(saved.openingQuestionFromAI),
        };
      }
    } catch (error) {
      // Start a clean conversation when session state is unavailable.
    }
    return {
      open: Boolean(document.querySelector('[data-advisor-page-mount]')),
      step: 'days',
      days: 4,
      budget: '$$',
      interests: [],
      history: [],
      sessionId: createSessionId(),
      requestCount: 0,
      lastRecommendations: [],
      recommendationSets: [],
      usedFallback: false,
      pendingAI: false,
      openingPending: false,
      openingQuestionFromAI: false,
    };
  }

  const state = readState();
  let activeRequestId = 0;

  function saveState() {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      // The widget remains usable when session storage is disabled.
    }
  }

  function setOpen(open, restoreFocus = false, focusPanel = true) {
    state.open = open;
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    launcher.setAttribute('aria-label', open ? 'Close AI Trip Advisor' : 'Open AI Trip Advisor');
    saveState();
    if (open && focusPanel) {
      const firstControl = panel.querySelector('input, button');
      if (firstControl) firstControl.focus();
    } else if (restoreFocus) {
      launcher.focus();
    }
  }

  function addMessage(text, role, record = true) {
    const message = document.createElement('div');
    message.className = `advisor-msg advisor-msg--${role}`;
    message.dataset.chatMessage = 'true';
    message.textContent = text;
    chat.appendChild(message);
    chat.scrollTop = chat.scrollHeight;
    if (record) {
      state.history.push({ text, role });
      saveState();
    }
    return message;
  }

  function addPendingIndicator(text) {
    const indicator = document.createElement('div');
    indicator.className = 'advisor-pending';
    indicator.setAttribute('role', 'status');
    indicator.textContent = text;
    chat.appendChild(indicator);
    chat.scrollTop = chat.scrollHeight;
    return indicator;
  }

  function addRestartAction(text) {
    const message = addMessage(text, 'bot');
    const restart = document.createElement('button');
    restart.type = 'button';
    restart.className = 'advisor-chip advisor-restart';
    restart.textContent = 'Start over';
    restart.addEventListener('click', resetConversation);
    message.appendChild(restart);
    return message;
  }

  function addQuickReplies(message, choices, onChoose, multiSelect = false) {
    message.classList.add('advisor-msg--with-replies');
    const group = document.createElement('div');
    group.className = 'advisor-quick-replies';
    group.setAttribute('role', 'group');
    choices.forEach((choice) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'advisor-chip';
      button.textContent = choice.label;
      button.dataset.value = choice.value;
      button.setAttribute(
        'aria-pressed',
        String(multiSelect && state.interests.includes(choice.value))
      );
      if (multiSelect && state.interests.includes(choice.value)) {
        button.classList.add('is-active');
      }
      button.addEventListener('click', () => onChoose(choice, button, group));
      group.appendChild(button);
    });
    message.appendChild(group);
    return group;
  }

  function attachDaysInput(message) {
    const form = document.createElement('form');
    form.className = 'advisor-inline-form';
    form.innerHTML = `
      <label class="sr-only" for="advisorDaysInput">Trip length in days</label>
      <input id="advisorDaysInput" type="number" min="1" max="14" value="${Number(state.days) || 4}" inputmode="numeric" required>
      <button type="submit" class="advisor-submit gold-accent">Continue</button>
    `;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = form.querySelector('input');
      const days = Math.min(14, Math.max(1, parseInt(input.value, 10) || 3));
      state.days = days;
      state.openingQuestionFromAI = false;
      addMessage(`${days} days`, 'user');
      state.step = 'budget';
      askBudget();
    });
    message.appendChild(form);
  }

  function askDays(restoring = false) {
    const message = restoring
      ? chat.querySelector('[data-chat-message]:last-child')
      : addMessage('How many days will you be in Jordan? (1–14)', 'bot');
    if (message) attachDaysInput(message);
  }

  function askBudget(restoring = false) {
    const message = restoring
      ? chat.querySelector('[data-chat-message]:last-child')
      : addMessage('What budget level works best for your trip?', 'bot');
    if (!message) return;
    addQuickReplies(message, budgets, (choice, button, group) => {
      group.querySelectorAll('.advisor-chip').forEach((chip) => {
        chip.setAttribute('aria-pressed', 'false');
        chip.classList.remove('is-active');
      });
      button.setAttribute('aria-pressed', 'true');
      button.classList.add('is-active');
      state.budget = choice.value;
      addMessage(`${choice.label} budget`, 'user');
      state.step = 'interests';
      askInterests();
    });
  }

  function askInterests(restoring = false) {
    const message = restoring
      ? chat.querySelector('[data-chat-message]:last-child')
      : addMessage('What are you into? Pick any that sound good.', 'bot');
    if (!message) return;
    const group = addQuickReplies(
      message,
      interests,
      (choice, button) => {
        if (state.interests.includes(choice.value)) {
          state.interests = state.interests.filter((value) => value !== choice.value);
          button.classList.remove('is-active');
          button.setAttribute('aria-pressed', 'false');
        } else {
          state.interests.push(choice.value);
          button.classList.add('is-active');
          button.setAttribute('aria-pressed', 'true');
        }
        saveState();
      },
      true
    );
    const submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'advisor-submit gold-accent advisor-interest-submit';
    submit.textContent = 'Show my suggestions';
    submit.addEventListener('click', () => {
      const selected = interests
        .filter((item) => state.interests.includes(item.value))
        .map((item) => item.label);
      addMessage(selected.length ? selected.join(', ') : 'Surprise me', 'user');
      state.step = 'done';
      saveState();
      requestAIResponse();
    });
    group.appendChild(submit);
  }

  function safeWebUrl(value) {
    try {
      const url = new URL(String(value || ''), window.location.href);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
    } catch (error) {
      return null;
    }
  }

  async function loadAllData() {
    if (loadAllData.cache) return loadAllData.cache;
    const [destinations, activities, accommodations] = await Promise.all([
      fetchJSON(getDataPath('destinations.json')),
      fetchJSON(getDataPath('activities.json')),
      fetchJSON(getDataPath('accommodations.json')),
    ]);
    loadAllData.cache = { destinations, activities, accommodations };
    return loadAllData.cache;
  }

  async function getSupabaseConfig() {
    const configPath = window.location.pathname.includes('/pages/')
      ? '../js/supabase-config.js'
      : './js/supabase-config.js';
    const configUrl = new URL(configPath, window.location.href);
    const config = await import(configUrl.href);
    const url = String(config.SUPABASE_URL || '')
      .trim()
      .replace(/\/$/, '');
    const anonKey = String(config.SUPABASE_ANON_KEY || '').trim();
    if (
      !/^https?:\/\//i.test(url) ||
      url.includes('your-project-ref') ||
      !anonKey ||
      anonKey.includes('your-supabase-anon-key')
    ) {
      throw new Error('Supabase project configuration is not set.');
    }
    return { url, anonKey };
  }

  function makeListingSubset(data) {
    const byBudget = (items) =>
      items.filter((item) => withinBudget(item.priceRange, state.budget)).slice(0, 40);
    const project = (item) => ({
      id: item.id,
      name: item.name,
      city: item.city || item.location || '',
      category: item.category || item.type || '',
      priceRange: item.priceRange || '',
      tags: Array.isArray(item.tags) ? item.tags.slice(0, 12) : [],
      shortDescription: item.shortDescription || '',
      longDescription: item.longDescription || '',
      bookingLink: item.bookingLink || '',
      mapLink: item.mapLink || '',
      officialLink: item.officialLink || '',
    });

    return {
      destinations: data.destinations.slice(0, 40).map(project),
      activities: byBudget(data.activities).map(project),
      accommodations: byBudget(data.accommodations).map(project),
    };
  }

  function setComposerEnabled(enabled) {
    if (!composer || !composerInput || !composerButton) return;
    composer.hidden = false;
    composerInput.disabled = !enabled;
    composerButton.disabled = !enabled;
  }

  async function callAdvisorFunction(data) {
    if (state.requestCount >= 20) {
      const error = new Error('The advisor is busy right now. Please try again shortly.');
      error.status = 429;
      throw error;
    }

    const { url, anonKey } = await getSupabaseConfig();
    state.requestCount += 1;
    saveState();
    const history = state.history.slice(-30).map((message) => ({
      role: message.role === 'bot' ? 'assistant' : 'user',
      content: message.text,
    }));
    const response = await fetch(`${url}/functions/v1/trip-advisor-chat`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: state.sessionId,
        history,
        listings: makeListingSubset(data),
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(result.message || 'The AI Trip Advisor is temporarily unavailable.');
      error.status = response.status;
      throw error;
    }
    if (typeof result.text !== 'string') {
      throw new Error('The AI Trip Advisor returned an invalid reply.');
    }
    return result;
  }

  function renderRecommendations(recommendations, data, persist = true) {
    const records = {
      destination: new Map(data.destinations.map((item) => [String(item.id), item])),
      activity: new Map(data.activities.map((item) => [String(item.id), item])),
      accommodation: new Map(data.accommodations.map((item) => [String(item.id), item])),
    };
    const validated = recommendations
      .filter(
        (recommendation) =>
          recommendation &&
          ['destination', 'activity', 'accommodation'].includes(recommendation.type) &&
          typeof recommendation.id === 'string'
      )
      .map((recommendation) => ({
        ...recommendation,
        item: records[recommendation.type]?.get(String(recommendation.id)),
      }))
      .filter((recommendation) => recommendation.item);
    if (!validated.length) return;

    const safeRecommendations = validated.map(({ type, id, reason }) => ({ type, id, reason }));
    if (persist) {
      state.lastRecommendations = safeRecommendations;
      state.recommendationSets.push(safeRecommendations);
      saveState();
    }
    const plan = document.createElement('article');
    plan.className = 'advisor-plan';
    const heading = document.createElement('h3');
    heading.textContent = 'Suggestions from Explore Jordan';
    plan.appendChild(heading);
    const intro = document.createElement('p');
    intro.className = 'advisor-plan-intro';
    intro.textContent = 'These picks are linked to the listings in our Jordan travel guide.';
    plan.appendChild(intro);

    const reasons = new Map(validated.map(({ type, id, reason }) => [`${type}:${id}`, reason]));
    const groups = [
      {
        type: 'destination',
        title: 'Destinations',
        items: validated.filter((entry) => entry.type === 'destination').map((entry) => entry.item),
        link: (item) => getAttractionDetailPath(item),
        meta: (item) => [item.category, item.city],
        tripType: 'destination',
      },
      {
        type: 'activity',
        title: 'Activities',
        items: validated.filter((entry) => entry.type === 'activity').map((entry) => entry.item),
        link: (item) => item.mapLink || null,
        meta: (item) => [item.priceRange, item.duration],
        tripType: 'activity',
      },
      {
        type: 'accommodation',
        title: 'Places to stay',
        items: validated
          .filter((entry) => entry.type === 'accommodation')
          .map((entry) => entry.item),
        link: (item) => item.bookingLink || null,
        meta: (item) => [item.priceRange, item.city],
        tripType: 'accommodation',
      },
    ];
    groups.forEach((group) => {
      if (group.items.length) {
        addRecommendationGroup(
          plan,
          group.title,
          group.items,
          group.link,
          group.meta,
          group.tripType,
          reasons
        );
      }
    });
    chat.appendChild(plan);
    updateTripButtons();
    chat.scrollTop = chat.scrollHeight;
  }

  async function requestAIResponse() {
    const requestId = ++activeRequestId;
    state.pendingAI = true;
    saveState();
    setComposerEnabled(false);
    chat.querySelectorAll('.advisor-quick-replies button').forEach((button) => {
      button.disabled = true;
    });
    const pending = addMessage('Thinking through your Jordan trip...', 'bot', false);
    try {
      const data = await loadAllData();
      const result = await callAdvisorFunction(data);
      if (requestId !== activeRequestId) return;
      pending.remove();
      state.pendingAI = false;
      state.lastRecommendations = [];
      addMessage(result.text, 'bot');
      renderRecommendations(
        Array.isArray(result.recommendations) ? result.recommendations : [],
        data
      );
      addRestartAction(restartPrompt);
      setComposerEnabled(true);
    } catch (error) {
      if (requestId !== activeRequestId) return;
      pending.remove();
      state.pendingAI = false;
      saveState();
      const busy = error.status === 429;
      addMessage(
        `${busy ? 'The AI Trip Advisor is busy right now. Please try again shortly.' : 'AI advice is unavailable right now.'} Running in quick-suggestion mode right now.`,
        'bot'
      );
      state.usedFallback = true;
      state.lastRecommendations = [];
      saveState();
      await buildRuleSuggestions();
    }
  }

  async function requestOpeningMessage() {
    const requestId = ++activeRequestId;
    if (!state.history.some((message) => message.openingTrigger)) {
      state.history.push({
        text: 'Hello, I would like help planning a trip to Jordan.',
        role: 'user',
        openingTrigger: true,
      });
    }
    state.pendingAI = true;
    state.openingPending = true;
    saveState();
    const pending = addPendingIndicator('Connecting to your trip advisor...');
    try {
      const data = await loadAllData();
      const result = await callAdvisorFunction(data);
      if (requestId !== activeRequestId) return;
      pending.remove();
      state.pendingAI = false;
      state.openingPending = false;
      state.openingQuestionFromAI = true;
      const opening = addMessage(result.text, 'bot');
      attachDaysInput(opening);
    } catch {
      if (requestId !== activeRequestId) return;
      pending.remove();
      state.pendingAI = false;
      state.openingPending = false;
      state.openingQuestionFromAI = false;
      state.usedFallback = true;
      addMessage('Hi! I can suggest a mix from the Jordan listings on this site.', 'bot');
      saveState();
      askDays();
    }
  }

  function createSessionId() {
    try {
      return crypto.randomUUID();
    } catch (error) {
      return `ej-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
  }

  function addRecommendationGroup(
    plan,
    title,
    items,
    getLink,
    getMeta,
    tripType = null,
    reasons = new Map()
  ) {
    const group = document.createElement('section');
    group.className = 'advisor-result-group';
    const heading = document.createElement('h4');
    heading.textContent = title;
    group.appendChild(heading);

    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'advisor-result-empty';
      empty.textContent = 'No matches at this budget. Try a higher budget or fewer interests.';
      group.appendChild(empty);
      plan.appendChild(group);
      return;
    }

    const list = document.createElement('ul');
    list.className = 'advisor-plan-list';
    items.forEach((item) => {
      const row = document.createElement('li');
      row.className = 'advisor-plan-item';

      const label = document.createElement('span');
      label.className = 'advisor-plan-label';
      label.textContent = item.name;
      const href = safeWebUrl(getLink(item));
      if (href) {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = item.name;
        if (new URL(href).origin !== window.location.origin) {
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        }
        row.appendChild(link);
      } else {
        row.appendChild(label);
      }

      const reason = reasons.get(`${tripType || title}:${item.id}`);
      if (reason) {
        const reasonText = document.createElement('span');
        reasonText.className = 'advisor-recommendation-reason';
        reasonText.textContent = reason;
        row.appendChild(reasonText);
      }

      const meta = document.createElement('span');
      meta.className = 'tag';
      meta.textContent = getMeta(item).filter(Boolean).join(' · ');
      row.appendChild(meta);

      if (tripType) {
        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.className = 'trip-button advisor-save-button';
        addButton.dataset.tripType = tripType;
        addButton.dataset.tripId = item.id;
        addButton.dataset.tripName = item.name;
        addButton.dataset.tripLocation = item.city || item.location || '';
        addButton.dataset.tripImage = item.image || '';
        addButton.dataset.tripCategory = item.category || '';
        addButton.setAttribute('aria-pressed', 'false');
        addButton.setAttribute('aria-label', `Add ${item.name} to Trip Planner`);
        addButton.textContent = 'Add to Trip';
        row.appendChild(addButton);
      }
      list.appendChild(row);
    });
    group.appendChild(list);
    plan.appendChild(group);
  }

  function renderPlan({ days, budget, destinations, activities, accommodations, broadened }) {
    const plan = document.createElement('article');
    plan.className = 'advisor-plan';

    const heading = document.createElement('h3');
    heading.textContent = `Suggestions for your ${days}-day trip (${budget} budget)`;
    plan.appendChild(heading);
    const intro = document.createElement('p');
    intro.className = 'advisor-plan-intro';
    intro.textContent = broadened
      ? 'There were no exact matches for every selected interest, so these suggestions include other options within your budget.'
      : 'Suggestions are matched from the destinations, activities, and stays listed on this site.';
    plan.appendChild(intro);

    const stayCount = Math.max(1, Math.ceil(days / 4));
    addRecommendationGroup(
      plan,
      'Places to stay',
      accommodations.slice(0, stayCount),
      (item) => item.bookingLink || null,
      (item) => [item.priceRange, item.city]
    );
    addRecommendationGroup(
      plan,
      'Destinations to explore',
      destinations.slice(0, Math.min(days, 5)),
      (item) => getAttractionDetailPath(item),
      (item) => [item.category, item.city],
      'destination'
    );
    addRecommendationGroup(
      plan,
      'Experiences to consider',
      activities.slice(0, Math.min(days, 5)),
      (item) => item.mapLink || null,
      (item) => [item.priceRange, item.duration],
      'activity'
    );

    chat.appendChild(plan);
    updateTripButtons();
    chat.scrollTop = chat.scrollHeight;
    state.usedFallback = true;
    state.lastRecommendations = [];
    addRestartAction(summaryText);
    if (composer) composer.hidden = false;
    if (composerInput) composerInput.disabled = false;
    if (composerButton) composerButton.disabled = false;
    saveState();
  }

  async function buildRuleSuggestions({ restoring = false } = {}) {
    const loadingMessage = addMessage(
      'Matching your preferences with Jordan destinations, activities, and stays...',
      'bot',
      false
    );

    try {
      const { destinations, activities, accommodations } = await loadAllData();
      const selectedInterests = new Set(state.interests.map((value) => normalize(value)));
      const matchedDestinations = destinations.filter((item) =>
        matchesInterests(item.tags, selectedInterests)
      );
      const matchedActivities = activities.filter(
        (item) =>
          withinBudget(item.priceRange, state.budget) &&
          matchesInterests(item.tags, selectedInterests)
      );
      const matchedStays = accommodations.filter(
        (item) =>
          withinBudget(item.priceRange, state.budget) &&
          matchesInterests(item.tags, selectedInterests)
      );
      const broadened =
        selectedInterests.size > 0 &&
        (!matchedDestinations.length || !matchedActivities.length || !matchedStays.length);

      loadingMessage.remove();
      const planData = {
        days: state.days,
        budget: state.budget,
        destinations: matchedDestinations.length ? matchedDestinations : destinations,
        activities: matchedActivities.length
          ? matchedActivities
          : activities.filter((item) => withinBudget(item.priceRange, state.budget)),
        accommodations: matchedStays.length
          ? matchedStays
          : accommodations.filter((item) => withinBudget(item.priceRange, state.budget)),
        broadened,
      };
      if (restoring && state.history[state.history.length - 1]?.text === summaryText) {
        state.history.pop();
      }
      renderPlan(planData);
    } catch (error) {
      loadingMessage.remove();
      addMessage('Trip suggestions could not load. Please try again in a moment.', 'bot');
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'advisor-chip';
      retry.textContent = 'Try again';
      retry.addEventListener('click', () => buildRuleSuggestions());
      chat.lastElementChild.appendChild(retry);
    }
  }

  function resetConversation() {
    activeRequestId += 1;
    state.step = 'days';
    state.days = 4;
    state.budget = '$$';
    state.interests = [];
    state.history = [];
    state.lastRecommendations = [];
    state.recommendationSets = [];
    state.usedFallback = false;
    state.pendingAI = false;
    state.openingPending = false;
    state.openingQuestionFromAI = false;
    chat.replaceChildren();
    saveState();
    requestOpeningMessage();
  }

  function restoreConversation() {
    const history = state.history.slice();
    if (state.step === 'done' && history[history.length - 1]?.text === summaryText) {
      history.pop();
    }
    history
      .filter((message) => !message.openingTrigger)
      .forEach((message) => {
        const bubble = addMessage(message.text, message.role, false);
        if (message.text === summaryText || message.text === restartPrompt) {
          const restart = document.createElement('button');
          restart.type = 'button';
          restart.className = 'advisor-chip advisor-restart';
          restart.textContent = 'Start over';
          restart.addEventListener('click', resetConversation);
          bubble.appendChild(restart);
        }
      });

    if (history.length === 0) {
      saveState();
      if (state.open) requestOpeningMessage();
      return;
    }

    if (state.openingPending) {
      requestOpeningMessage();
      return;
    }

    if (state.step === 'days') {
      if (state.openingQuestionFromAI) {
        const opening = chat.querySelector('[data-chat-message]:last-child');
        if (opening) attachDaysInput(opening);
      } else {
        askDays(true);
      }
    }
    if (state.step === 'budget') askBudget(true);
    if (state.step === 'interests') askInterests(true);
    if (state.step === 'done') {
      setComposerEnabled(true);
      if (state.pendingAI) {
        requestAIResponse();
      } else if (state.usedFallback) {
        buildRuleSuggestions({ restoring: true });
      }
      if (state.recommendationSets.length) {
        loadAllData()
          .then((data) => {
            state.recommendationSets.forEach((recommendations) =>
              renderRecommendations(recommendations, data, false)
            );
          })
          .catch(() => {});
      }
    }
  }

  composer?.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = composerInput.value.trim();
    if (!text || composerButton.disabled) return;
    composerInput.value = '';
    state.lastRecommendations = [];
    addMessage(text, 'user');
    requestAIResponse();
  });

  launcher.addEventListener('click', () => {
    const open = !state.open;
    setOpen(open);
    if (open && state.history.length === 0) requestOpeningMessage();
  });
  closeButton.addEventListener('click', () => setOpen(false, true));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.open) setOpen(false, true);
  });

  restoreConversation();
  setOpen(state.open, false, false);
})();
