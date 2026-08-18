/**
 * Similarity Engine for YC Companies
 * 
 * Computes relatedness scores between companies based on:
 * - Industry + Subindustry match (highest weight)
 * - Tag overlap (Jaccard similarity coefficient)
 * - Batch proximity (closer batches = higher score)
 * - Region overlap bonus
 * - Description keyword intersection
 */

// In-memory cache: companyId -> sorted similar companies
const similarityCache = new Map();

/**
 * Extract keywords from a text string.
 * Removes stop words and returns unique meaningful words.
 */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'that', 'this',
  'these', 'those', 'it', 'its', 'they', 'them', 'their', 'we', 'our',
  'your', 'you', 'he', 'she', 'his', 'her', 'who', 'what', 'which',
  'where', 'when', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'not', 'only', 'than', 'too',
  'very', 'just', 'about', 'above', 'after', 'again', 'also', 'any',
  'as', 'into', 'out', 'over', 'so', 'up', 'using', 'through'
]);

function extractKeywords(text) {
  if (!text) return new Set();
  return new Set(
    text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w))
  );
}

/**
 * Compute Jaccard similarity between two sets.
 * Returns value between 0 (no overlap) and 1 (identical).
 */
function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

/**
 * Parse batch string (e.g., "Summer 2024") into a numeric value for proximity.
 */
function batchToNumeric(batchStr) {
  if (!batchStr) return 0;
  const match = batchStr.match(/(\w+)\s+(\d+)/);
  if (!match) return 0;
  const season = match[1];
  const year = parseInt(match[2]);
  const seasonVal = season.toLowerCase().startsWith('w') ? 0 : 0.5;
  return year + seasonVal;
}

/**
 * Compute similarity score between two companies.
 * Returns a value between 0 (unrelated) and 100 (identical).
 */
function computeSimilarity(companyA, companyB) {
  let score = 0;

  // 1. Industry match (30 points max)
  if (companyA.industry && companyB.industry) {
    if (companyA.industry === companyB.industry) {
      score += 25;
      // Subindustry bonus
      if (companyA.subindustry && companyA.subindustry === companyB.subindustry) {
        score += 5;
      }
    }
  }

  // 2. Tag overlap — Jaccard (25 points max)
  const tagsA = new Set((companyA.tags || []).map(t => t.toLowerCase()));
  const tagsB = new Set((companyB.tags || []).map(t => t.toLowerCase()));
  score += jaccardSimilarity(tagsA, tagsB) * 25;

  // 3. Description keyword overlap (20 points max)
  const kwA = extractKeywords(companyA.one_liner);
  const kwB = extractKeywords(companyB.one_liner);
  const descKwA = extractKeywords(companyA.long_description);
  const descKwB = extractKeywords(companyB.long_description);
  
  // Combine one-liner and description keywords
  const allKwA = new Set([...kwA, ...descKwA]);
  const allKwB = new Set([...kwB, ...descKwB]);
  score += jaccardSimilarity(allKwA, allKwB) * 20;

  // 4. Batch proximity (15 points max — closer batches score higher)
  const batchA = batchToNumeric(companyA.batch);
  const batchB = batchToNumeric(companyB.batch);
  if (batchA && batchB) {
    const batchDiff = Math.abs(batchA - batchB);
    // Same batch = 15 points, diff of 1 year = 10 points, etc.
    score += Math.max(0, 15 - batchDiff * 3);
  }

  // 5. Region overlap (10 points max)
  if (companyA.regions && companyB.regions) {
    const regA = new Set(companyA.regions);
    const regB = new Set(companyB.regions);
    const regionOverlap = [...regA].some(r => regB.has(r));
    if (regionOverlap) score += 10;
  }

  return Math.min(100, Math.round(score));
}

/**
 * Find the top N most similar companies to the given target company.
 * Uses caching to avoid recomputation.
 * 
 * @param {Object} targetCompany - The company to find similar companies for
 * @param {Array} allCompanies - Full dataset of companies
 * @param {number} topN - Number of similar companies to return (default: 5)
 * @returns {Array} - Array of { company, score } sorted by score descending
 */
export function findSimilarCompanies(targetCompany, allCompanies, topN = 5) {
  if (!targetCompany || !allCompanies || allCompanies.length === 0) return [];

  const cacheKey = targetCompany.id;
  
  // Check cache
  if (similarityCache.has(cacheKey)) {
    return similarityCache.get(cacheKey).slice(0, topN);
  }

  // Compute scores against all other companies
  const scored = allCompanies
    .filter(c => c.id !== targetCompany.id) // Exclude self
    .map(c => ({
      company: c,
      score: computeSimilarity(targetCompany, c)
    }))
    .filter(s => s.score > 15) // Minimum threshold to be "similar"
    .sort((a, b) => b.score - a.score)
    .slice(0, 20); // Cache top 20, return top N

  // Cache the result
  similarityCache.set(cacheKey, scored);

  return scored.slice(0, topN);
}

/**
 * Clear the similarity cache (call when data changes).
 */
export function clearSimilarityCache() {
  similarityCache.clear();
}
