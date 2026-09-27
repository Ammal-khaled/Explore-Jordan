(function (root, factory) {
  const rules = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = rules;
  } else {
    root.ExploreJordanAdvisorRules = rules;
  }
})(globalThis, function () {
  const budgetRank = { $: 1, $$: 2, $$$: 3 };

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function withinBudget(priceRange, chosenBudget) {
    if (!priceRange) return true;
    return (budgetRank[priceRange] || 2) <= budgetRank[chosenBudget];
  }

  function matchesInterests(tags = [], interests) {
    if (!interests || !interests.size) return true;
    const normalizedTags = tags.map(normalize);
    return [...interests].some((interest) => normalizedTags.some((tag) => tag.includes(interest)));
  }

  return Object.freeze({ normalize, withinBudget, matchesInterests });
});
