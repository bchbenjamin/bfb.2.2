# BengaluruDuru — Image & Icon Asset Inventory

This document lists every image, icon, and visual asset needed for the BengaluruDuru platform. Each entry specifies what the image shows, where it should be placed, what format to use, and where to source or generate it.

---

## 1. App Branding

### 1.1 App Logo / Favicon
- **Description:** A rounded square icon with green background (#386a1f) and white "BD" text. Used as the browser tab favicon and the header logo.
- **Path:** `/client/public/favicon.svg`
- **Format:** SVG
- **Source:** Already generated inline in the codebase. The SVG contains a rounded rectangle with the app initials.
- **Sizes needed:** The SVG scales to any size. For PWA manifest, generate these from the SVG:
  - `/client/public/icons/icon-192.png` — 192x192 PNG
  - `/client/public/icons/icon-512.png` — 512x512 PNG
- **Tool to generate PNGs:** Use [realfavicongenerator.net](https://realfavicongenerator.net) or [svgtopng.com](https://svgtopng.com) to convert the SVG to PNGs at the required sizes.

### 1.2 Full Logo with Text
- **Description:** The "BD" icon beside the text "BengaluruDuru" in Noto Sans semibold. Used on the login page and potentially the README.
- **Path:** `/client/public/assets/logo-full.svg`
- **Format:** SVG
- **Source:** Create using Figma, Inkscape, or any vector editor. Combine the favicon icon with the app name text. Green primary color (#386a1f) for text, white background.

### 1.3 Login Page — DigiLocker Mockup Logo
- **Description:** A shield icon with a checkmark, styled in blue/green to resemble the DigiLocker branding. This is NOT the official DigiLocker logo — it is a simulated placeholder to convey "government identity verification."
- **Path:** `/client/public/assets/digilocker-sim.svg`
- **Format:** SVG
- **Source:** Use the Lucide `Shield` icon (already imported in the codebase via `lucide-react`). No separate file needed — the icon is rendered inline in `LoginPage.jsx`. If a standalone image is preferred, export the Lucide Shield icon as SVG from [lucide.dev/icons/shield](https://lucide.dev/icons/shield).

---

## 2. Map Marker Icons

### 2.1 Category Marker Icons (12 total)
Each category has a colored circular marker with an emoji icon inside. These are rendered as Leaflet `divIcon` elements using inline HTML/CSS — **no image files are needed**. The implementation is in `GrievanceMap.jsx`.

| Category | Emoji | Marker Color | Notes |
|----------|-------|-------------|-------|
| Roads & Footpaths | 🛣️ | #8B4513 (SaddleBrown) | Pothole, road damage |
| Water Supply | 💧 | #1E90FF (DodgerBlue) | No water, pipeline issues |
| Sewage & Drainage | 🚰 | #556B2F (DarkOliveGreen) | Blocked drains, sewage |
| Garbage & Waste | 🗑️ | #8B8000 (DarkKhaki) | Illegal dumping |
| Street Lighting | 💡 | #FFD700 (Gold) | Broken lights |
| Parks & Open Spaces | 🌳 | #228B22 (ForestGreen) | Park maintenance |
| Encroachment | 🏗️ | #A0522D (Sienna) | Illegal construction |
| Noise Pollution | 🔊 | #FF6347 (Tomato) | Loud music, construction noise |
| Traffic & Signals | 🚦 | #DC143C (Crimson) | Signal malfunction |
| Public Transport | 🚌 | #4169E1 (RoyalBlue) | BMTC/Metro issues |
| Building Violations | 🏢 | #696969 (DimGray) | Unauthorized construction |
| Other | 📋 | #808080 (Gray) | Catch-all category |

- **Path:** No file paths — these are CSS-styled `divIcon` elements
- **Format:** Inline HTML in Leaflet markers
- **Source:** Native emoji + CSS. See `/client/src/components/map/GrievanceMap.jsx`, `createCategoryIcon()` function.

---

## 3. Empty State Illustrations

### 3.1 No Grievances Found
- **Description:** A simple illustration of an empty clipboard or a peaceful city skyline. Displayed when a user's search/filter returns zero results.
- **Path:** `/client/public/assets/empty-state.svg`
- **Format:** SVG
- **Source:** Generate using [undraw.co](https://undraw.co) — search for "empty" or "no data". Set the primary color to `#386a1f` (the app's green). Download as SVG. Alternatively, use [storyset.com](https://storyset.com) or [humaaans.com](https://humaaans.com) for free illustrations.

### 3.2 No Assignments (Officer View)
- **Description:** A checkmark with a relaxed figure, indicating "all clear — nothing assigned."
- **Path:** `/client/public/assets/all-clear.svg`
- **Format:** SVG
- **Source:** [undraw.co](https://undraw.co) — search for "completed" or "relaxing". Set color to `#386a1f`.

### 3.3 404 Page
- **Description:** A confused map pin or a broken road sign.
- **Path:** `/client/public/assets/not-found.svg`
- **Format:** SVG
- **Source:** [undraw.co](https://undraw.co) — search for "not found" or "page not found". Set color to `#386a1f`.

---

## 4. Status Icons

These are **not image files** — they are rendered using the `lucide-react` icon library which is already installed.

| Status | Icon Component | Color |
|--------|---------------|-------|
| Open | `Circle` | Blue (#3b82f6) |
| Assigned | `UserCheck` | Yellow (#eab308) |
| In Progress | `Loader2` | Orange (#f97316) |
| Resolved Pending | `Clock` | Purple (#a855f7) |
| Resolved Final | `CheckCircle` | Green (#22c55e) |
| Reopened | `AlertCircle` | Red (#ef4444) |

- **Source:** `lucide-react` package — [lucide.dev](https://lucide.dev)
- **Path:** No files needed, imported inline in components.

---

## 5. Hero / Marketing Images

### 5.1 Hero Banner — Bengaluru Skyline
- **Description:** A wide banner showing the Bengaluru city skyline or a recognizable Bengaluru landmark (Vidhana Soudha, Lalbagh, Cubbon Park) with a green tint overlay matching the app's primary color.
- **Path:** `/client/public/assets/hero-bengaluru.webp`
- **Format:** WebP (for optimal compression)
- **Dimensions:** 1920x600px (landscape banner)
- **Source:** Use a royalty-free image from:
  - [Unsplash](https://unsplash.com/s/photos/bengaluru) — search "Bengaluru" or "Bangalore"
  - [Pexels](https://pexels.com/search/bangalore/) — search "Bangalore skyline"
  - Apply a green gradient overlay (`rgba(56, 106, 31, 0.4)`) in any image editor
  - Convert to WebP using [squoosh.app](https://squoosh.app) for optimal file size

### 5.2 Kannada Cultural Element
- **Description:** A decorative element featuring Kannada script or traditional Karnataka patterns (Mysore painting style, Hoysala temple motif). Used as a subtle background texture in the login page or footer.
- **Path:** `/client/public/assets/hero-kannada.png`
- **Format:** PNG with transparency
- **Dimensions:** 800x400px
- **Source:** Generate using AI art tools (Midjourney, DALL-E) with prompt: "Traditional Karnataka Hoysala temple motif pattern, green and gold, flat design, transparent background". Alternatively, use free Karnataka government art from [karnataka.gov.in](https://karnataka.gov.in) cultural section.

---

## 6. Cluster Marker Styles

The Leaflet MarkerCluster plugin uses CSS classes for cluster styling. **No images needed** — colors are set via CSS in `/client/src/index.css`.

| Cluster Size | CSS Class | Background Color | Text Color |
|-------------|-----------|-----------------|------------|
| Small (2-10) | `.marker-cluster-small` | rgba(229,231,187,0.6) | White on green |
| Medium (11-50) | `.marker-cluster-medium` | rgba(206,147,0,0.6) | White on amber |
| Large (50+) | `.marker-cluster-large` | rgba(179,38,30,0.6) | White on red |

---

## 7. Deployment & Documentation Graphics

### 7.1 Architecture Diagram
- **Description:** A system architecture diagram showing: User → React Frontend → Express API → PostgreSQL + Gemini AI. With arrows showing data flow.
- **Path:** `/Modules/architecture-diagram.png`
- **Format:** PNG
- **Dimensions:** 1200x800px
- **Source:** Generate using [draw.io](https://app.diagrams.net), [excalidraw.com](https://excalidraw.com), or [mermaid.live](https://mermaid.live). Use the green color palette.

### 7.2 ER Diagram (Database)
- **Description:** An Entity-Relationship diagram showing the 5 database tables (users, grievances, upvotes, resolution_proofs, alerts) and their relationships.
- **Path:** `/Modules/er-diagram.png`
- **Format:** PNG
- **Dimensions:** 1000x700px
- **Source:** Generate from the schema.sql using [dbdiagram.io](https://dbdiagram.io) — paste the CREATE TABLE statements and export. Free, no signup needed.

---

## Summary Table

| # | Asset | File Needed? | Path | Status |
|---|-------|-------------|------|--------|
| 1 | Favicon | Yes (exists) | `/client/public/favicon.svg` | Done |
| 2 | Full logo | Optional | `/client/public/assets/logo-full.svg` | To create |
| 3 | DigiLocker mockup | No (inline icon) | — | Done |
| 4 | Category markers (12) | No (CSS divIcon) | — | Done |
| 5 | Empty state illustration | Optional | `/client/public/assets/empty-state.svg` | To source from undraw.co |
| 6 | All-clear illustration | Optional | `/client/public/assets/all-clear.svg` | To source from undraw.co |
| 7 | 404 illustration | Optional | `/client/public/assets/not-found.svg` | To source from undraw.co |
| 8 | Status icons | No (lucide-react) | — | Done |
| 9 | Hero banner | Optional | `/client/public/assets/hero-bengaluru.webp` | To source from Unsplash |
| 10 | Kannada cultural art | Optional | `/client/public/assets/hero-kannada.png` | To generate |
| 11 | Cluster styles | No (CSS) | — | Done |
| 12 | Architecture diagram | Optional | `/Modules/architecture-diagram.png` | To create in draw.io |
| 13 | ER diagram | Optional | `/Modules/er-diagram.png` | To create in dbdiagram.io |

**Items marked "Done"** are already implemented in code (inline SVG, CSS styles, or icon components).
**Items marked "Optional"** enhance the visual experience but the app functions fully without them.
**Items marked "To create/source"** should be generated before final deployment using the tools listed above.
