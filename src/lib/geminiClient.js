import { getAuthHeader } from './firebase';
import { getSetting } from './storage';

/**
 * Stream analysis for a startup using the Python backend API.
 * @param {Object} company - The company object
 * @param {string} mode - 'teardown' | 'techspec' | 'competitive' | 'buildguide'
 * @param {Array} similarCompanies - Similar companies list (used for competitive mode)
 * @param {Function} onChunk - Callback receiving text chunks
 */
export async function streamStartupAnalysis(company, mode, similarCompanies, onChunk) {
  const header = getAuthHeader();
  
  const [provider, model, apiKey] = await Promise.all([
    getSetting('yc_llm_provider'),
    getSetting('yc_llm_model'),
    getSetting('yc_llm_api_key')
  ]);

  const response = await fetch('/api/ai/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': header
    },
    body: JSON.stringify({
      company,
      mode,
      similarCompanies: similarCompanies || [],
      provider: provider || null,
      model: model || null,
      apiKey: apiKey || null
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI Analysis failed: ${errorText || response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunkText = decoder.decode(value);
    onChunk(chunkText);
  }
}

/**
 * Generate a new startup idea using the Python backend API.
 * @param {Object} inputs - { industry, problemArea, techStack }
 * @param {Array} inspirationStartups - List of YC companies as reference
 * @param {Function} onChunk - Callback receiving text chunks
 */
export async function streamIdeaGeneration(inputs, inspirationStartups, onChunk) {
  const header = getAuthHeader();

  const [provider, model, apiKey] = await Promise.all([
    getSetting('yc_llm_provider'),
    getSetting('yc_llm_model'),
    getSetting('yc_llm_api_key')
  ]);

  const response = await fetch('/api/ai/generate-idea', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': header
    },
    body: JSON.stringify({
      industry: inputs.industry || 'Any',
      problemArea: inputs.problemArea || 'Any',
      techStack: inputs.techStack || 'Modern Web Stack',
      inspirationStartups: inspirationStartups || [],
      provider: provider || null,
      model: model || null,
      apiKey: apiKey || null
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Idea generation failed: ${errorText || response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunkText = decoder.decode(value);
    onChunk(chunkText);
  }
}
