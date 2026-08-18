import Fuse from 'fuse.js';

// Fuse.js options for weighted fuzzy search across all company fields
const FUSE_OPTIONS = {
  keys: [
    { name: 'name', weight: 0.35 },
    { name: 'one_liner', weight: 0.25 },
    { name: 'industry', weight: 0.12 },
    { name: 'subindustry', weight: 0.08 },
    { name: 'tags', weight: 0.10 },
    { name: 'long_description', weight: 0.07 },
    { name: 'all_locations', weight: 0.03 }
  ],
  threshold: 0.4,        // Controls fuzziness (0 = exact, 1 = match anything)
  distance: 200,         // How far to search within a string
  minMatchCharLength: 2, // Min chars before matching
  includeScore: true,    // Return relevance scores for ranking
  includeMatches: true,  // Return match positions for highlighting
  ignoreLocation: true,  // Search the full text, not just the beginning
  useExtendedSearch: false,
  shouldSort: true
};

let fuseInstance = null;
let indexedCompanies = null;

/**
 * Initialize or update the Fuse.js index.
 * Called once when companies data loads, and re-uses the same instance.
 */
export function initFuseIndex(companies) {
  if (indexedCompanies === companies && fuseInstance) {
    return fuseInstance;
  }
  fuseInstance = new Fuse(companies, FUSE_OPTIONS);
  indexedCompanies = companies;
  return fuseInstance;
}

/**
 * Perform a fuzzy search across the companies dataset.
 * Returns array of { item: company, score: number, matches: [] }
 * Score is 0 (perfect match) to 1 (worst match).
 */
export function fuzzySearch(companies, query) {
  if (!query || query.trim().length < 2) {
    return null; // Return null to signal "no search active"
  }

  const fuse = initFuseIndex(companies);
  const results = fuse.search(query.trim());

  return results.map(r => ({
    item: r.item,
    score: r.score,        // 0 = perfect, 1 = no match
    relevance: Math.round((1 - r.score) * 100), // 0-100 percentage
    matches: r.matches || []
  }));
}

/**
 * Get search suggestions when there are zero results.
 * Returns up to 3 closest matches with relaxed threshold.
 */
export function getSearchSuggestions(companies, query) {
  if (!query || query.trim().length < 2) return [];

  const relaxedFuse = new Fuse(companies, {
    ...FUSE_OPTIONS,
    threshold: 0.7, // Much more relaxed for suggestions
    distance: 400
  });

  const results = relaxedFuse.search(query.trim());
  return results.slice(0, 3).map(r => ({
    item: r.item,
    score: r.score,
    relevance: Math.round((1 - r.score) * 100)
  }));
}
