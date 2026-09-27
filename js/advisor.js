(function () {
  const chat = document.getElementById('advisorChat');
  const form = document.getElementById('advisorForm');
  const budgetChips = document.getElementById('budgetChips');
  const interestChips = document.getElementById('interestChips');
  const submitButton = form?.querySelector('[type="submit"]');

  if (!chat || !form || !budgetChips || !interestChips || !submitButton) return;

  const budgetRank = { '$': 1, '$$': 2, '$$$': 3 };

  function addMessage(text, role) {
    const message = document.createElement('div');
    message.className = `advisor-msg advisor-msg--${role}`;
    message.textContent = text;
    chat.appendChild(message);
    chat.scrollTop = chat.scrollHeight;
    return message;
  }

  function setupChips(container, multiSelect) {
    container.querySelectorAll('.advisor-chip').forEach(button => {
      button.setAttribute('aria-pressed', String(button.classList.contains('is-active')));
    });

    container.addEventListener('click', event => {
      const button = event.target.closest('.advisor-chip');
      if (!button || !container.contains(button)) return;

      if (multiSelect) {
        button.classList.toggle('is-active');
      } else {
        container.querySelectorAll('.advisor-chip').forEach(chip => {
          chip.classList.remove('is-active');
          chip.setAttribute('aria-pressed', 'false');
        });
        button.classList.add('is-active');
      }
      button.setAttribute('aria-pressed', String(button.classList.contains('is-active')));
    });
  }

  setupChips(budgetChips, false);
  setupChips(interestChips, true);

  function normalize(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function withinBudget(priceRange, chosenBudget) {
    if (!priceRange) return true;
    return (budgetRank[priceRange] || 2) <= budgetRank[chosenBudget];
  }

  function matchesInterests(tags = [], interests) {
    if (!interests.size) return true;
    const normalizedTags = tags.map(normalize);
    return [...interests].some(interest => normalizedTags.some(tag => tag.includes(interest)));
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
    const [destinations, activities, accommodations] = await Promise.all([
      fetchJSON(getDataPath('destinations.json')),
      fetchJSON(getDataPath('activities.json')),
      fetchJSON(getDataPath('accommodations.json')),
    ]);
    return { destinations, activities, accommodations };
  }

  function addRecommendationGroup(plan, title, items, getLink, getMeta, tripType = null) {
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
    items.forEach(item => {
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
    addRecommendationGroup(plan, 'Places to stay', accommodations.slice(0, stayCount),
      item => item.bookingLink || null,
      item => [item.priceRange, item.city]);
    addRecommendationGroup(plan, 'Destinations to explore', destinations.slice(0, Math.min(days, 5)),
      item => getAttractionDetailPath(item),
      item => [item.category, item.city], 'destination');
    addRecommendationGroup(plan, 'Experiences to consider', activities.slice(0, Math.min(days, 5)),
      item => item.mapLink || null,
      item => [item.priceRange, item.duration], 'activity');

    chat.appendChild(plan);
    updateTripButtons();
    chat.scrollTop = chat.scrollHeight;
    addMessage('Change your preferences and build again, or save places you like in Trip Planner.', 'bot');
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitButton.disabled) return;

    const daysInput = document.getElementById('tripDays');
    const days = Math.min(14, Math.max(1, parseInt(daysInput.value, 10) || 3));
    daysInput.value = String(days);
    const budget = budgetChips.querySelector('.is-active')?.dataset.value || '$$';
    const interests = new Set(
      [...interestChips.querySelectorAll('.is-active')].map(button => normalize(button.dataset.value))
    );

    addMessage(`${days} days, ${budget} budget${interests.size ? `, interests: ${[...interests].join(', ')}` : ''}.`, 'user');
    const loadingMessage = addMessage('Matching your preferences with the listed Jordan destinations, activities, and stays...', 'bot');
    submitButton.disabled = true;
    submitButton.textContent = 'Building suggestions...';

    try {
      const { destinations, activities, accommodations } = await loadAllData();
      const matchedDestinations = destinations.filter(item => matchesInterests(item.tags, interests));
      const matchedActivities = activities.filter(item => withinBudget(item.priceRange, budget) && matchesInterests(item.tags, interests));
      const matchedStays = accommodations.filter(item => withinBudget(item.priceRange, budget) && matchesInterests(item.tags, interests));
      const broadened = interests.size > 0 && (!matchedDestinations.length || !matchedActivities.length || !matchedStays.length);

      loadingMessage.remove();
      renderPlan({
        days,
        budget,
        destinations: matchedDestinations.length ? matchedDestinations : destinations,
        activities: matchedActivities.length ? matchedActivities : activities.filter(item => withinBudget(item.priceRange, budget)),
        accommodations: matchedStays.length ? matchedStays : accommodations.filter(item => withinBudget(item.priceRange, budget)),
        broadened,
      });
    } catch (error) {
      loadingMessage.remove();
      addMessage('Trip suggestions could not load. Please try again in a moment.', 'bot');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Build my suggestions';
    }
  });

  addMessage('Hi! Choose your trip length, budget, and interests, and I will suggest a mix from the Jordan listings on this site.', 'bot');
})();
