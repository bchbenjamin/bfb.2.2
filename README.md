<div align="center">
  <img src="client/public/logo.png" alt="BengaluruDuru Logo" width="120" />
  
  <h1>BengaluruDuru</h1>
  <p><b>Your neighborhood's voice, powered by Generative AI.</b></p>

  <!-- SOCIAL BADGES -->
  <a href="https://github.com/bchbenjamin/bfb.2.2/stargazers">
    <img src="https://img.shields.io/github/stars/bchbenjamin/bfb.2.2?style=for-the-badge&color=2ecc71" alt="Stars" />
  </a>
  <a href="https://github.com/bchbenjamin/bfb.2.2/network/members">
    <img src="https://img.shields.io/github/forks/bchbenjamin/bfb.2.2?style=for-the-badge&color=3498db" alt="Forks" />
  </a>
  <a href="https://github.com/bchbenjamin/bfb.2.2/issues">
    <img src="https://img.shields.io/github/issues/bchbenjamin/bfb.2.2?style=for-the-badge&color=e74c3c" alt="Issues" />
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT" />
  </a>
</div>

<br />

<!-- 
=======================================================================
TEAM INSTRUCTIONS FOR MEDIA:
1. DEMO VIDEO: Upload your demo video to YouTube. Take a screenshot of the video player, save it in the repository (e.g., `client/public/demo-thumbnail.png`), and replace the links below.
2. SCREENSHOTS: Replace the placeholder URLs in the "Features" section with actual raw GitHub URLs of your app screenshots.
=======================================================================
-->

## 🎬 See it in Action

<div align="center">
  <a href="[INSERT_YOUTUBE_LINK_HERE]">
    <img src="https://img.youtube.com/vi/YOUR_VIDEO_ID/maxresdefault.jpg" alt="Watch the Demo Video" width="800" style="border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
  </a>
  <p><i>Click the image above to watch the pitch & demo!</i></p>
</div>

---

## 🚀 The Vision
Reporting civic issues like potholes, broken streetlights, or water shortages is often tedious, undocumented, and ignored. **BengaluruDuru** revolutionizes citizen-government interaction. By leveraging Google's **Gemini 2.5 Flash API**, we eliminate manual form-filling, automatically categorize grievances using NLP, group duplicate complaints geographically, and demand visual proof of resolution—ensuring unprecedented civic accountability.

---

## 🧠 Key Technical Innovations

- **Zero-Friction Filing via NLP:** Users just type _"Huge pothole near MG Road junction."_ Our custom Gemini AI pipeline extracts the exact location, categorizes the issue (e.g., *Roads & Footpaths > Pothole*), assigns a Priority (1-5), and auto-routes it—all under 800ms.
- **Strict Structured AI Outputs:** We implement Google's `SchemaType` enums at the API level. This entirely prevents AI hallucinations, forcing the model to select valid departments and severities that the BBMP (city council) database expects.
- **Spatial Anomaly Detection (Clustering):** The backend actively monitors coordinate geometry. If multiple citizens report "no water" within a 500-meter radius within 48 hours, the system auto-spikes the priority to *Emergency* and alerts officials of a possible pipe burst.
- **AI-Powered Resolution Proof:** Government workers cannot just click "Resolved." They must upload a photo of the fixed issue. Gemini Vision cross-references the citizen's original photo against the officer's proof photo, generates a confidence match score, and blocks fraudulent closures.
- **Equitable Tech (i18n & TTS):** Built for the masses. Deeply integrated i18n supporting English, Kannada, Tulu, and Konkani. Features a native Text-To-Speech (TTS) engine that reads the interface aloud for the visually impaired or non-literate.

---

## 📸 Platform Highlights

<!-- INSTRUCTION: Add your real screenshots below. Replace "https://via.placeholder.com/..." with the path to your actual images -->

<details open>
<summary><b>1. Map-First Citizen Interface 🗺️</b></summary>
<br>
<img src="https://via.placeholder.com/800x400?text=Insert+Map+Screenshot+Here" width="100%" alt="Map Interface" />
<em>Citizens can view live neighborhood issues, upvote ("I'm affected too!") to boost priority, or drop a pin to report a new problem.</em>
</details>

<details open>
<summary><b>2. Officer Dashboard & Analytics 📊</b></summary>
<br>
<img src="https://via.placeholder.com/800x400?text=Insert+Dashboard+Screenshot+Here" width="100%" alt="Admin Dashboard" />
<em>A powerful command center for officials providing intelligent sorting, heatmap toggles, and real-time alerts.</em>
</details>

<details open>
<summary><b>3. Resolution Verification Engine 📸</b></summary>
<br>
<img src="https://via.placeholder.com/800x400?text=Insert+Verification+Screenshot+Here" width="100%" alt="Verification Setup" />
<em>Before and after comparisons powered by AI and human-in-the-loop (Citizen receives a 24-hour window to contest a fix).</em>
</details>

---

## 🛠️ Built With

<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Neon_Postgres-00E599?style=for-the-badge&logo=postgresql&logoColor=black" />
  <img src="https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
</div>

---

## ⚙️ Quick Start Guide

Want to run this locally? It takes less than 2 minutes.

```bash
# 1. Clone the repository
git clone https://github.com/bchbenjamin/bfb.2.2.git
cd bfb.2.2

# 2. Install dependencies for both frontend and backend
npm install

# 3. Secure your environment
# Create a .env file in the /server directory with your GEMINI_API_KEY and DATABASE_URL
# Create a .env file in the /client directory with VITE_API_URL=http://localhost:3001

# 4. Initialize and Seed the Database
npm run db:init --workspace=server
npm run db:seed --workspace=server

# 5. Launch the ecosystem
npm run dev
```
*The app will automatically launch at `http://localhost:5173`. We've included a unified `concurrently` script that spins up both the Vite frontend and Node backend simultaneously.*

---

## 🤝 Let's Connect!

We built BengaluruDuru because we believe technology should serve the public good. If you found this project interesting, let's connect!

<!-- INSTRUCTION: Replace these LinkedIn URLs with your actual profile links! -->

<div align="center">
  <a href="[INSERT_YOUR_LINKEDIN_URL]">
    <img src="https://img.shields.io/badge/LinkedIn-Connect_with_Benjamin-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" />
  </a>
</div>

<br>
<div align="center">
  <i>If you like this project, please give it a ⭐ on GitHub!</i>
</div>
