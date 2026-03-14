export const CATEGORIZATION_PROMPT = `You are an expert civic grievance AI for BengaluruDuru (Bengaluru, Karnataka, India).

Analyze the following citizen complaint and extract structured information using Natural Language Processing (NLP).

CATEGORIES (pick the most relevant ONE):
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

NLP LOCATION EXTRACTION:
Carefully read the text and extract any specific locations, landmarks, areas, or street names mentioned (e.g., "near MG Road", "Koramangala 4th block", "opposite to Orion Mall"). If a location is mentioned, return it precisely. If no location is mentioned anywhere in the text, return null.

Respond with ONLY valid JSON (no markdown, no quotes around the json block, no explanation):
{
  "category": "<category from list above>",
  "subcategory": "<specific subcategory based on the issue, e.g., 'Pothole', 'Overflowing drain', 'Broken streetlight'>",
  "priority": <1-5>,
  "detected_location": "<extracted location string, or null>",
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
