# BengaluruDuru — Architecture Document

## System Overview

BengaluruDuru is a monorepo application with a React frontend and Express.js backend, connected to a Neon PostgreSQL database and Google Gemini 1.5 Flash for AI processing.

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│  React SPA   │────▶│  Express.js API  │────▶│  Neon (PG)   │
│  (Vite)      │◀────│  (Node.js)       │◀────│  PostgreSQL  │
└─────────────┘     └────────┬────────┘     └──────────────┘
                             │
                    ┌────────▼────────┐
                    │  Gemini 1.5     │
                    │  Flash API      │
                    └─────────────────┘
```

## Database Schema (ER Diagram)

```
┌──────────────┐       ┌────────────────────┐       ┌───────────────┐
│   users       │       │    grievances       │       │   upvotes      │
├──────────────┤       ├────────────────────┤       ├───────────────┤
│ id (PK, UUID)│◀──┐   │ id (PK, UUID)      │◀──────│ id (PK, UUID) │
│ aadhaar_id   │   │   │ user_id (FK)───────│───┐   │ grievance_id  │
│ name         │   │   │ title              │   │   │ user_id (FK)  │
│ email        │   │   │ raw_description    │   │   │ created_at    │
│ phone        │   │   │ ai_category        │   │   └───────────────┘
│ role         │   │   │ ai_subcategory     │   │   UNIQUE(grievance_id,
│ language_pref│   │   │ ai_priority (1-5)  │   │          user_id)
│ ward         │   │   │ ai_detected_location│  │
│ created_at   │   │   │ latitude           │   │   ┌───────────────────┐
└──────────────┘   │   │ longitude          │   │   │ resolution_proofs  │
                   │   │ status             │   │   ├───────────────────┤
                   │   │ media_url          │   │   │ id (PK, UUID)     │
                   │   │ media_verified     │   │   │ grievance_id (FK) │
                   │   │ officer_id (FK)────│───┘   │ officer_id (FK)   │
                   │   │ verification_      │       │ photo_url         │
                   │   │   deadline         │       │ ai_match_score    │
                   │   │ impact_count       │       │ citizen_verified  │
                   │   │ ward               │       │ created_at        │
                   │   │ created_at         │       └───────────────────┘
                   │   │ updated_at         │
                   │   └────────────────────┘
                   │
                   │   ┌──────────────────┐
                   │   │     alerts        │
                   │   ├──────────────────┤
                   │   │ id (PK, UUID)    │
                   │   │ category         │
                   │   │ radius_center_lat│
                   │   │ radius_center_lng│
                   │   │ grievance_count  │
                   │   │ message          │
                   │   │ severity         │
                   │   │ created_at       │
                   │   │ resolved_at      │
                   │   └──────────────────┘
```

### Status Flow

```
open → assigned → in_progress → resolved_pending → resolved_final
                                       ↓
                                   reopened → (back to open/assigned)
```

### Key Indexes

- `idx_grievances_spatial (ai_category, created_at, latitude, longitude)` — Supports the Haversine spatial buffer query
- `idx_grievances_impact (impact_count DESC)` — Supports engagement-based sorting
- `idx_alerts_active (resolved_at) WHERE resolved_at IS NULL` — Partial index for active alerts only

---

## AI Prompt Strategy

### 1. Grievance Categorization (Text → Structured JSON)

**Model:** Gemini 1.5 Flash
**Temperature:** 0.1 (low for consistency)
**Response format:** `application/json` (native structured output)

**System prompt structure:**
```
You are an AI assistant for BengaluruDuru...
Analyze the following citizen complaint and extract structured information.
CATEGORIES: [12 categories listed]
PRIORITY SCALE: 1-5 with definitions
Respond with ONLY valid JSON:
{
  "category": string,
  "subcategory": string,
  "priority": 1-5,
  "detected_location": string|null,
  "suggested_title": string (max 80 chars),
  "is_duplicate": boolean
}
```

**Fallback behavior:** If Gemini fails (rate limit, network error), the grievance is still created with default values: category="Other", priority=3.

### 2. Media Verification (Image + Text → JSON)

**Purpose:** Verify that an uploaded photo matches the complaint description.

**Input:** Multimodal — one image (base64) + text prompt with description.

**Output:**
```json
{
  "matches_description": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "one sentence"
}
```

### 3. Resolution Verification (2 Images + Text → JSON)

**Purpose:** Compare original complaint photo with officer's proof-of-fix photo.

**Input:** Multimodal — two images (original + proof) + text prompt with original description.

**Output:**
```json
{
  "appears_resolved": true/false,
  "match_score": 0.0-1.0,
  "reasoning": "one sentence"
}
```

---

## Spatial Anomaly Detection

### Algorithm: Real-Time Spatial Buffer Check

On every `POST /api/grievances`, after inserting the new grievance:

1. Query for all grievances with the SAME category within 500m radius created in the last 3 hours
2. Uses Haversine formula in SQL for distance calculation
3. If count >= 5 (threshold), create an alert

**Haversine SQL (with float safety clamping):**
```sql
6371000 * acos(
  LEAST(1.0, GREATEST(-1.0,
    cos(radians($lat)) * cos(radians(latitude)) *
    cos(radians(longitude) - radians($lng)) +
    sin(radians($lat)) * sin(radians(latitude))
  ))
) < 500
```

The `LEAST/GREATEST` clamping prevents `acos()` domain errors from floating-point imprecision.

### Alert Severity
- count >= 5: `warning`
- count >= 10: `critical`

---

## 24-Hour Verification Deadline

**Strategy: Lazy Evaluation (no cron job)**

1. When officer uploads proof: `verification_deadline = NOW() + 24 hours`, `status = 'resolved_pending'`
2. On every `GET /api/grievances/:id`, the server checks:
   - Is status `resolved_pending`?
   - Has `verification_deadline` passed?
   - If yes → auto-update to `resolved_final`
3. Race condition protection: The UPDATE uses `WHERE status = 'resolved_pending'` so concurrent requests don't conflict

---

## Authentication Flow (Simulated DigiLocker)

```
Frontend                    Backend
   │                           │
   │  Show DigiLocker UI       │
   │  (Aadhaar + Name input)   │
   │                           │
   │  "Send OTP" clicked       │
   │  Show OTP input           │
   │  (accepts 123456)         │
   │                           │
   │  POST /api/auth/login     │
   │  {aadhaar_id, name, otp}  │───▶ Validate format
   │                           │     UPSERT user
   │                           │     Sign JWT (7d expiry)
   │  ◀── { token, user }     │
   │                           │
   │  Store token in           │
   │  localStorage             │
   │  Decode JWT for user info │
   │                           │
   │  All API calls include    │
   │  Authorization: Bearer    │───▶ Verify JWT middleware
   │                           │     Extract user from payload
```
