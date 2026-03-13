export const CATEGORIZATION_PROMPT = `You are an AI assistant for BengaluruDuru, a public grievance platform for Bengaluru, Karnataka, India.

Analyze the following citizen complaint and extract structured information.

CATEGORIES (pick one):
- Roads & Footpaths
- Water Supply
- Sewage & Drainage
- Garbage & Waste
- Street Lighting
- Parks & Open Spaces
- Encroachment
- Noise Pollution
- Traffic & Signals
- Public Transport (BMTC/Metro)
- Building Violations
- Other

PRIORITY SCALE:
1 = Low (cosmetic/minor inconvenience)
2 = Moderate (affects daily routine)
3 = High (health/safety risk)
4 = Urgent (immediate danger to public)
5 = Critical (life-threatening/emergency)

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "category": "<category from list above>",
  "subcategory": "<specific subcategory, e.g. Pothole, Blocked drain>",
  "priority": <1-5>,
  "detected_location": "<location mentioned in text, or null>",
  "suggested_title": "<concise title summarizing the issue, max 80 chars>",
  "is_duplicate": false
}

CITIZEN COMPLAINT:
`;

export const MEDIA_VERIFICATION_PROMPT = `You are verifying whether an uploaded photo matches a citizen's grievance description.

Description: "{description}"

Analyze the image and respond with ONLY valid JSON (no markdown):
{
  "matches_description": true or false,
  "confidence": 0.0 to 1.0,
  "reasoning": "<one sentence explaining your assessment>"
}`;

export const RESOLUTION_VERIFICATION_PROMPT = `You are comparing two photos for a public grievance resolution:
1. FIRST IMAGE: The original complaint photo showing the problem.
2. SECOND IMAGE: The officer's proof-of-fix photo.

Original complaint: "{description}"

Determine if the second photo shows that the issue from the first photo has been resolved.

Respond with ONLY valid JSON (no markdown):
{
  "appears_resolved": true or false,
  "match_score": 0.0 to 1.0,
  "reasoning": "<one sentence>"
}`;
