import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { CATEGORIZATION_PROMPT, MEDIA_VERIFICATION_PROMPT, RESOLUTION_VERIFICATION_PROMPT } from '../utils/aiPrompts.js';
import { AI_DEFAULTS, CATEGORIES } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

// ─── Schema definitions for Gemini structured output ───────────────────────
const CATEGORIZATION_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    category: {
      type: SchemaType.STRING,
      description: 'One of the exact categories from the list',
      enum: CATEGORIES,
    },
    subcategory: {
      type: SchemaType.STRING,
      description: 'Specific sub-issue, e.g. Pothole, Overflowing drain',
    },
    priority: {
      type: SchemaType.INTEGER,
      description: 'Priority 1-5',
    },
    detected_location: {
      type: SchemaType.STRING,
      description: 'Location extracted from text, or empty string if none found',
      nullable: true,
    },
    suggested_title: {
      type: SchemaType.STRING,
      description: 'Concise title, max 80 chars',
    },
    is_duplicate: {
      type: SchemaType.BOOLEAN,
    },
  },
  required: ['category', 'subcategory', 'priority', 'suggested_title', 'is_duplicate'],
};

const MEDIA_VERIFICATION_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    matches_description: { type: SchemaType.BOOLEAN },
    confidence: { type: SchemaType.NUMBER },
    reasoning: { type: SchemaType.STRING },
  },
  required: ['matches_description', 'confidence', 'reasoning'],
};

const RESOLUTION_VERIFICATION_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    appears_resolved: { type: SchemaType.BOOLEAN },
    match_score: { type: SchemaType.NUMBER },
    reasoning: { type: SchemaType.STRING },
  },
  required: ['appears_resolved', 'match_score', 'reasoning'],
};

// ─── Model factory (lazy singletons) ──────────────────────────────────────
const models = {};

function getModel(schemaKey, schema) {
  if (!models[schemaKey]) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    models[schemaKey] = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.15,
      },
    });
    logger.info(`[AI] Model initialized for schema: ${schemaKey}`);
  }
  return models[schemaKey];
}

// ─── Safe JSON extractor ──────────────────────────────────────────────────
function safeParseJSON(text) {
  try { return JSON.parse(text.trim()); } catch (_) {}
  try { return JSON.parse(text.replace(/```json\s*/gi, '').replace(/```/g, '').trim()); } catch (_) {}
  const m = text.match(/\{[\s\S]*\}/);
  if (m) try { return JSON.parse(m[0]); } catch (_) {}
  return null;
}

// ─── Categorize grievance ─────────────────────────────────────────────────
export async function categorizeGrievance(rawDescription) {
  const MAX = 6;
  let lastErr = null;

  for (let i = 1; i <= MAX; i++) {
    try {
      logger.info(`[AI] categorize attempt ${i}/${MAX}`, { len: rawDescription.length });

      const model = getModel('categorize', CATEGORIZATION_SCHEMA);
      const result = await model.generateContent(CATEGORIZATION_PROMPT + rawDescription);
      const raw = result.response.text();

      logger.debug(`[AI] raw response attempt ${i}`, { raw: raw.slice(0, 400) });

      const parsed = safeParseJSON(raw);
      if (!parsed || !parsed.category) throw new Error('Bad JSON: ' + raw.slice(0, 200));

      // Enforce category is in our list (schema enum should handle this, but just in case)
      if (!CATEGORIES.includes(parsed.category)) {
        const lower = parsed.category.toLowerCase();
        const match = CATEGORIES.find(c => c.toLowerCase() === lower)
          || CATEGORIES.find(c => c.toLowerCase().includes(lower) || lower.includes(c.toLowerCase()));
        parsed.category = match || AI_DEFAULTS.category;
      }

      // Enforce priority bounds
      if (typeof parsed.priority !== 'number' || parsed.priority < 1 || parsed.priority > 5) {
        parsed.priority = 3;
      }

      // Ensure title exists
      parsed.suggested_title = parsed.suggested_title || rawDescription.slice(0, 80);
      parsed.is_duplicate = parsed.is_duplicate || false;

      logger.info(`[AI] categorize SUCCESS`, {
        category: parsed.category,
        sub: parsed.subcategory,
        priority: parsed.priority,
        location: parsed.detected_location,
        attempt: i,
      });
      return parsed;
    } catch (err) {
      lastErr = err;
      logger.warn(`[AI] categorize FAIL attempt ${i}`, { err: err.message });
      if (i < MAX) await new Promise(r => setTimeout(r, 700 * i));
    }
  }

  logger.error('[AI] categorize FAILED all retries', { err: lastErr?.message });
  return {
    category: AI_DEFAULTS.category,
    subcategory: AI_DEFAULTS.subcategory,
    priority: AI_DEFAULTS.priority,
    detected_location: null,
    suggested_title: rawDescription.slice(0, 80),
    is_duplicate: false,
  };
}

// ─── Verify media matches description ─────────────────────────────────────
export async function verifyMedia(imageBase64, mimeType, description) {
  const MAX = 4;
  let lastErr = null;

  for (let i = 1; i <= MAX; i++) {
    try {
      logger.info(`[AI] verifyMedia attempt ${i}/${MAX}`);
      const model = getModel('media', MEDIA_VERIFICATION_SCHEMA);
      const prompt = MEDIA_VERIFICATION_PROMPT.replace('{description}', description);
      const result = await model.generateContent([
        { inlineData: { data: imageBase64, mimeType } },
        { text: prompt },
      ]);
      const raw = result.response.text();
      logger.debug(`[AI] verifyMedia raw`, { raw: raw.slice(0, 300) });

      const parsed = safeParseJSON(raw);
      if (!parsed || typeof parsed.matches_description !== 'boolean') {
        throw new Error('Bad media JSON: ' + raw.slice(0, 200));
      }

      logger.info(`[AI] verifyMedia SUCCESS`, { matches: parsed.matches_description, attempt: i });
      return parsed;
    } catch (err) {
      lastErr = err;
      logger.warn(`[AI] verifyMedia FAIL attempt ${i}`, { err: err.message });
      if (i < MAX) await new Promise(r => setTimeout(r, 1000));
    }
  }

  logger.error('[AI] verifyMedia FAILED all retries', { err: lastErr?.message });
  return { matches_description: true, confidence: 0, reasoning: 'AI verification unavailable' };
}

// ─── Verify resolution proof ──────────────────────────────────────────────
export async function verifyResolution(origBase64, origMime, proofBase64, proofMime, description) {
  const MAX = 4;
  let lastErr = null;

  for (let i = 1; i <= MAX; i++) {
    try {
      logger.info(`[AI] verifyResolution attempt ${i}/${MAX}`);
      const model = getModel('resolution', RESOLUTION_VERIFICATION_SCHEMA);
      const prompt = RESOLUTION_VERIFICATION_PROMPT.replace('{description}', description);
      const result = await model.generateContent([
        { inlineData: { data: origBase64, mimeType: origMime } },
        { inlineData: { data: proofBase64, mimeType: proofMime } },
        { text: prompt },
      ]);
      const raw = result.response.text();
      logger.debug(`[AI] verifyResolution raw`, { raw: raw.slice(0, 300) });

      const parsed = safeParseJSON(raw);
      if (!parsed || typeof parsed.appears_resolved !== 'boolean') {
        throw new Error('Bad resolution JSON: ' + raw.slice(0, 200));
      }

      logger.info(`[AI] verifyResolution SUCCESS`, { score: parsed.match_score, attempt: i });
      return parsed;
    } catch (err) {
      lastErr = err;
      logger.warn(`[AI] verifyResolution FAIL attempt ${i}`, { err: err.message });
      if (i < MAX) await new Promise(r => setTimeout(r, 1000));
    }
  }

  logger.error('[AI] verifyResolution FAILED all retries', { err: lastErr?.message });
  return { appears_resolved: false, match_score: 0, reasoning: 'AI verification unavailable' };
}
