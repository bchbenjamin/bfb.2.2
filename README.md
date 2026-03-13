# BengaluruDuru

**Your neighborhood's voice, powered by AI.**

BengaluruDuru is a platform where citizens of Bengaluru can report civic issues — potholes, broken streetlights, overflowing drains, garbage dumps — and get them resolved faster than ever before.

---

## What Can You Do?

### Report a Problem
See a pothole on your street? A broken water pipe? Open BengaluruDuru, describe the problem in your own words (in English or Kannada), drop a pin on the map, snap a photo, and hit submit. Our AI figures out the rest — what category it falls under, how urgent it is, and where exactly it is.

### Support Your Neighbors
Instead of filing duplicate complaints, you can see existing issues on the map. Found someone already reported the pothole you were going to? Just click **"I'm affected too"** to increase its priority. The more people affected, the faster it gets attention.

### Track the Fix
When a government officer fixes the issue, they upload a photo of the completed work. **You get 24 hours** to check the photo and confirm the fix is real. If it's not done properly, you can reopen the complaint with one click.

### Speak Your Language
BengaluruDuru works in **English**, **Kannada (ಕನ್ನಡ)**, **Tulu (ತುಳು)**, and **Konkani (कोंकणी)**. Switch languages anytime using the globe button. You can even have the page read aloud to you in English or Kannada.

---

## How It Works

```
You describe the problem
        ↓
AI categorizes it automatically
        ↓
It appears on the city map
        ↓
Other affected citizens upvote it
        ↓
Officers see the most impactful issues first
        ↓
Officer fixes it and uploads proof
        ↓
You verify the fix within 24 hours
        ↓
Issue resolved!
```

---

## The Proof System

We believe in transparency. Here's how it works:

1. **You report** — Describe the issue and upload a photo
2. **AI verifies** — Our AI checks if the photo matches your description
3. **Officer responds** — They visit the location and upload a "proof of fix" photo
4. **AI cross-checks** — The AI compares the before and after photos
5. **You confirm** — You have 24 hours to accept or reject the resolution
6. **If you don't respond** — The issue is automatically marked as resolved after 24 hours

No more "resolved" complaints that were never actually fixed.

---

## Keeping Your Area Safe

When many people in the same area report similar problems (like "no water supply"), our system detects the pattern and flags it as a potential emergency — like a mainline burst. This helps authorities respond to large-scale issues faster.

---

## Getting Started

### For Citizens
1. Open BengaluruDuru in your browser
2. Sign in using the DigiLocker-style authentication
3. Browse the map to see existing issues in your area
4. Report new issues or upvote existing ones

### For Running Locally

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd bfb2

# 2. Copy the environment file and fill in your details
cp .env.example .env

# 3. Install everything
npm install

# 4. Set up the database
npm run db:init --workspace=server
npm run db:seed --workspace=server

# 5. Start the app
npm run dev
```

The app will open at `http://localhost:5173`.

**Test login:** Use any 12-digit number as Aadhaar, any name, and OTP `123456`.

---

## Languages Supported

| Language | Script | Text-to-Speech |
|----------|--------|----------------|
| English  | Latin  | Yes            |
| Kannada  | ಕನ್ನಡ  | Yes            |
| Tulu     | ತುಳು   | Text only      |
| Konkani  | कोंकणी | Text only      |

*Tulu and Konkani do not have native browser text-to-speech support. The interface is fully translated, but the "Read Aloud" feature is only available in English and Kannada.*

---

## Credits & Inspiration

This project draws inspiration from several sources:

- **[AI_Powered_Grievance_Redressal_System](https://github.com/anshikaparikh/AI_Powered_Grievance_Redressal_System)** by anshikaparikh — AI-based semantic search and categorization logic
- **[AI-Grievance-Redressal-System-WEB](https://github.com/sriyansh-dev/AI-Grievance-Redressal-System-WEB)** by sriyansh-dev — Full-stack grievance system architecture
- **[public-pulsev2](https://github.com/WambiruL/public-pulsev2)** by WambiruL — Citizen feedback and engagement patterns
- **Janaspandana AI** — Karnataka Government's initiative for citizen grievance redressal
- **IPGRS Karnataka** — Integrated Public Grievance Redress System by the Government of Karnataka

Built with the citizens of Bengaluru in mind.

---

## License

This project is for educational and demonstration purposes.
