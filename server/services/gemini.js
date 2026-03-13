import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  CATEGORIZATION_PROMPT,
  MEDIA_VERIFICATION_PROMPT,
  RESOLUTION_VERIFICATION_PROMPT,
} from '../utils/aiPrompts.js';
import { AI_DEFAULTS } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

let model = null;

function getModel() {
  if (!model) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });
    logger.info('Gemini model initialized');
  }
  return model;
}

export async function categorizeGrievance(rawDescription) {
  try {
    logger.debug('Gemini: categorizing grievance', { descriptionLength: rawDescription.length });
    const result = await getModel().generateContent(
      CATEGORIZATION_PROMPT + rawDescription
    );
    const text = result.response.text();
    const parsed = JSON.parse(text);
    logger.info('Gemini: categorization success', { category: parsed.category, priority: parsed.priority });
    return parsed;
  } catch (err) {
    logger.error('Gemini categorization failed', { error: err.message });
    return {
      category: AI_DEFAULTS.category,
      subcategory: AI_DEFAULTS.subcategory,
      priority: AI_DEFAULTS.priority,
      detected_location: AI_DEFAULTS.detected_location,
      suggested_title: rawDescription.slice(0, 80),
      is_duplicate: false,
    };
  }
}

export async function verifyMedia(imageBase64, mimeType, description) {
  try {
    logger.debug('Gemini: verifying media against description');
    const prompt = MEDIA_VERIFICATION_PROMPT.replace('{description}', description);
    const result = await getModel().generateContent([
      { inlineData: { data: imageBase64, mimeType } },
      { text: prompt },
    ]);
    const parsed = JSON.parse(result.response.text());
    logger.info('Gemini: media verification result', { matches: parsed.matches_description });
    return parsed;
  } catch (err) {
    logger.error('Gemini media verification failed', { error: err.message });
    return { matches_description: true, confidence: 0, reasoning: 'AI verification unavailable' };
  }
}

export async function verifyResolution(
  originalImageBase64,
  originalMime,
  proofImageBase64,
  proofMime,
  originalDescription
) {
  try {
    logger.debug('Gemini: verifying resolution proof');
    const prompt = RESOLUTION_VERIFICATION_PROMPT.replace('{description}', originalDescription);
    const parts = [
      { inlineData: { data: originalImageBase64, mimeType: originalMime } },
      { inlineData: { data: proofImageBase64, mimeType: proofMime } },
      { text: prompt },
    ];
    const result = await getModel().generateContent(parts);
    const parsed = JSON.parse(result.response.text());
    logger.info('Gemini: resolution verification result', { matchScore: parsed.match_score });
    return parsed;
  } catch (err) {
    logger.error('Gemini resolution verification failed', { error: err.message });
    return { appears_resolved: false, match_score: 0, reasoning: 'AI verification unavailable' };
  }
}
