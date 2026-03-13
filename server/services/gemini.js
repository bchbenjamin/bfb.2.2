import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  CATEGORIZATION_PROMPT,
  MEDIA_VERIFICATION_PROMPT,
  RESOLUTION_VERIFICATION_PROMPT,
} from '../utils/aiPrompts.js';
import { AI_DEFAULTS } from '../utils/constants.js';

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
  }
  return model;
}

export async function categorizeGrievance(rawDescription) {
  try {
    const result = await getModel().generateContent(
      CATEGORIZATION_PROMPT + rawDescription
    );
    const text = result.response.text();
    return JSON.parse(text);
  } catch (err) {
    console.error('Gemini categorization failed:', err.message);
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
    const prompt = MEDIA_VERIFICATION_PROMPT.replace('{description}', description);
    const result = await getModel().generateContent([
      { inlineData: { data: imageBase64, mimeType } },
      { text: prompt },
    ]);
    return JSON.parse(result.response.text());
  } catch (err) {
    console.error('Gemini media verification failed:', err.message);
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
    const prompt = RESOLUTION_VERIFICATION_PROMPT.replace('{description}', originalDescription);
    const parts = [
      { inlineData: { data: originalImageBase64, mimeType: originalMime } },
      { inlineData: { data: proofImageBase64, mimeType: proofMime } },
      { text: prompt },
    ];
    const result = await getModel().generateContent(parts);
    return JSON.parse(result.response.text());
  } catch (err) {
    console.error('Gemini resolution verification failed:', err.message);
    return { appears_resolved: false, match_score: 0, reasoning: 'AI verification unavailable' };
  }
}
