# BengaluruDuru — API Documentation

Base URL: `http://localhost:3001` (development) or `https://your-app.vercel.app` (production)

All endpoints prefixed with `/api`.

---

## Authentication

### POST /api/auth/login

Simulated DigiLocker/Aadhaar login. Upserts user and returns JWT.

**Request Body:**
```json
{
  "aadhaar_id": "123456789012",
  "name": "Ramesh Kumar",
  "email": "ramesh@example.com",
  "phone": "9876543210",
  "otp": "123456",
  "language_pref": "en"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| aadhaar_id | string | Yes | Exactly 12 digits |
| name | string | Yes | Full name |
| email | string | No | Email address |
| phone | string | No | Phone number |
| otp | string | No | Must be "123456" if provided |
| language_pref | string | No | One of: en, kn, tcy, kok. Default: en |

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "name": "Ramesh Kumar",
    "role": "citizen",
    "language_pref": "en",
    "ward": null,
    "email": "ramesh@example.com"
  }
}
```

**Errors:**
- `400` — Invalid Aadhaar format or missing name
- `400` — Invalid OTP (if provided and not "123456")

---

### GET /api/auth/me

Get current authenticated user info.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Ramesh Kumar",
  "role": "citizen",
  "language_pref": "en",
  "ward": null,
  "email": "ramesh@example.com"
}
```

---

## Grievances

### GET /api/grievances

List grievances with filters and pagination. Sorted by impact (most affected first) by default.

**Query Parameters:**

| Param | Type | Default | Options |
|-------|------|---------|---------|
| status | string | (all) | open, assigned, in_progress, resolved_pending, resolved_final, reopened |
| category | string | (all) | Any valid category name |
| ward | string | (all) | Ward name |
| sort | string | impact | impact, recent, priority |
| page | int | 1 | Page number |
| limit | int | 20 | Items per page (max 100) |

**Response (200):**
```json
{
  "grievances": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user_name": "Ramesh Kumar",
      "title": "Large pothole on 100ft Road",
      "raw_description": "There is a massive pothole...",
      "ai_category": "Roads & Footpaths",
      "ai_subcategory": "Pothole",
      "ai_priority": 4,
      "ai_detected_location": "100ft Road, Indiranagar",
      "latitude": 12.9784,
      "longitude": 77.6408,
      "status": "open",
      "media_url": "/uploads/123456.jpg",
      "media_verified": true,
      "officer_id": null,
      "verification_deadline": null,
      "impact_count": 23,
      "ward": "Indiranagar",
      "created_at": "2026-03-13T10:00:00Z",
      "updated_at": "2026-03-13T10:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "totalPages": 3
}
```

---

### GET /api/grievances/map

Lightweight data for map markers. Returns only fields needed for rendering.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "latitude": 12.9784,
    "longitude": 77.6408,
    "ai_category": "Roads & Footpaths",
    "ai_priority": 4,
    "status": "open",
    "title": "Large pothole on 100ft Road",
    "impact_count": 23
  }
]
```

Returns max 1000 grievances (excluding resolved_final).

---

### GET /api/grievances/:id

Get single grievance with resolution proofs and upvote count. Performs lazy 24-hour verification deadline check.

**Response (200):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "user_name": "Ramesh Kumar",
  "title": "Large pothole on 100ft Road",
  "raw_description": "...",
  "ai_category": "Roads & Footpaths",
  "ai_subcategory": "Pothole",
  "ai_priority": 4,
  "ai_detected_location": "100ft Road, Indiranagar",
  "latitude": 12.9784,
  "longitude": 77.6408,
  "status": "open",
  "media_url": "/uploads/123456.jpg",
  "media_verified": true,
  "officer_id": null,
  "verification_deadline": null,
  "impact_count": 23,
  "ward": "Indiranagar",
  "created_at": "2026-03-13T10:00:00Z",
  "updated_at": "2026-03-13T10:00:00Z",
  "proofs": [],
  "upvotes": 22
}
```

---

### POST /api/grievances

Create a new grievance. Triggers AI categorization and spatial buffer check.

**Headers:** `Authorization: Bearer <token>`
**Content-Type:** `multipart/form-data`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| raw_description | string | Yes | Citizen's raw complaint text |
| latitude | number | Yes | Location latitude |
| longitude | number | Yes | Location longitude |
| media | file | No | Image file (jpeg, png, webp, max 5MB) |

**Response (201):**
```json
{
  "grievance": {
    "id": "uuid",
    "title": "AI-generated title",
    "status": "open",
    "ai_category": "Sewage & Drainage",
    "ai_subcategory": "Blocked Drain",
    "ai_priority": 4,
    "ai_detected_location": "Indiranagar Metro Station",
    "impact_count": 1,
    "..."
  },
  "ai_analysis": {
    "category": "Sewage & Drainage",
    "subcategory": "Blocked Drain",
    "priority": 4,
    "detected_location": "Indiranagar Metro Station",
    "suggested_title": "Overflowing drain near Indiranagar Metro",
    "is_duplicate": false
  },
  "media_verified": true,
  "spatial_alert": null
}
```

If a spatial cluster is detected (5+ same-category complaints within 500m in 3 hours):
```json
{
  "spatial_alert": {
    "count": 7,
    "isAlert": true,
    "severity": "warning",
    "message": "Cluster detected: 7 \"Water Supply\" complaints within 500m in the last 3 hours"
  }
}
```

---

### POST /api/grievances/:id/upvote

"I'm affected too" — atomically adds upvote and increments impact count.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "impact_count": 24,
  "already_upvoted": false
}
```

If user already upvoted:
```json
{
  "impact_count": 24,
  "already_upvoted": true
}
```

---

### POST /api/grievances/:id/resolve

Officer uploads proof of fix. Sets 24-hour verification deadline.

**Headers:** `Authorization: Bearer <token>` (officer or admin role required)
**Content-Type:** `multipart/form-data`

| Field | Type | Required |
|-------|------|----------|
| proof | file | Yes |

**Response (200):**
```json
{
  "grievance": {
    "id": "uuid",
    "status": "resolved_pending",
    "verification_deadline": "2026-03-14T10:00:00Z",
    "..."
  },
  "ai_match_score": 0.85
}
```

---

### POST /api/grievances/:id/verify

Citizen verifies or reopens. Only the original filer can call this.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{ "verified": true }
```
or
```json
{ "verified": false }
```

**Response (200):** Updated grievance object with new status (`resolved_final` or `reopened`).

---

### POST /api/grievances/:id/assign

Admin assigns an officer to a grievance.

**Headers:** `Authorization: Bearer <token>` (admin role required)

**Request Body:**
```json
{ "officer_id": "uuid" }
```

**Response (200):** Updated grievance with status `assigned`.

---

## Alerts

### GET /api/alerts

Get active anomaly alerts (unresolved).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
[
  {
    "id": "uuid",
    "category": "Water Supply",
    "radius_center_lat": 13.0035,
    "radius_center_lng": 77.5648,
    "grievance_count": 8,
    "message": "Cluster detected: 8 \"Water Supply\" complaints within 500m...",
    "severity": "warning",
    "created_at": "2026-03-13T10:00:00Z",
    "resolved_at": null
  }
]
```

### POST /api/alerts/:id/resolve

Mark an alert as resolved.

**Headers:** `Authorization: Bearer <token>`

**Response (200):** Updated alert with `resolved_at` timestamp.

---

## Dashboard

### GET /api/dashboard/stats

Overview statistics. Requires officer or admin role.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "total": 45,
  "open": 28,
  "assigned": 5,
  "in_progress": 3,
  "resolved": 7,
  "reopened": 2,
  "avg_hours_to_resolve": 18.5,
  "categories": [
    { "ai_category": "Roads & Footpaths", "count": 12 },
    { "ai_category": "Water Supply", "count": 8 }
  ],
  "wards": [
    { "ward": "Koramangala", "count": 6 },
    { "ward": "Indiranagar", "count": 5 }
  ]
}
```

### GET /api/dashboard/heatmap

Heatmap intensity data for all unresolved grievances.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
[
  { "latitude": 12.9784, "longitude": 77.6408, "intensity": 4 },
  { "latitude": 12.9352, "longitude": 77.6245, "intensity": 3 }
]
```

### GET /api/dashboard/officers

List officers for grievance assignment. Admin role required.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Priya Nair",
    "ward": "Jayanagar",
    "active_cases": 3
  }
]
```

---

## Health Check

### GET /api/health

No authentication required.

**Response (200):**
```json
{ "status": "ok", "service": "bengaluruduru" }
```

---

## Error Responses

All errors follow this format:
```json
{ "error": "Description of what went wrong" }
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request — missing or invalid parameters |
| 401 | Not authenticated — missing or invalid token |
| 403 | Forbidden — insufficient role permissions |
| 404 | Not found — resource doesn't exist |
| 500 | Server error — check logs |
