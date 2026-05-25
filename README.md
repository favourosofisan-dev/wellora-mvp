# Wellora - AI-First Senior Wellness PWA

**Live app:** [wellora-for-seniors.netlify.app](https://wellora-for-seniors.netlify.app)

Wellora is a **voice-controlled, AI-powered wellness platform** designed specifically for seniors. It offers gentle, low-impact exercises and also includes safety warnings, seated options, and caregiver reporting - all in an installable PWA that works offline.

---

## Features

### Voice Navigation
Hands-free control: *"Go home"*, *"Show balance exercises"*, *"Start this exercise"*. Built with the Web Speech API.

### Safety First
- "Stop if dizzy" warnings before every session
- Seated & low-impact toggles for every exercise
- Contraindication notes (e.g., "Perform near a wall" for balance moves)

### 90 Exercises, 9 Categories
Balance & Stability | Flexibility | Weight Control | Boosting Metabolism | Sexual Health | Mobility & Flexibility | Sleep & Mental Wellbeing | Energy Levels | Cognitive Function

### Mood & Energy Check-in
Tap how you feel: 🙂 😐 😣 😴 - Wellora adapts the workout recommendation.

### AI Journal & Weekly Summary
After each exercise, speak or type how you feel. Every Monday, AI (OpenAI GPT-3.5) generates a warm, encouraging summary of your week.

### Smart Reminders (optional)
Set your preferred time and city. Wellora checks the weather and sends a gentle nudge (e.g., *"Rainy day? Perfect for a seated workout."*).

### Caregiver Report
Download a weekly PDF report with progress, mood trends, and journal highlights - share with family via WhatsApp or email.

### PWA - Installs Like an App
- Add to home screen - works offline
- No app store, no updates to install
- Fast, cached, senior-friendly

### Voice Coach
Tap the "Voice Coach" button - the app reads instructions aloud.

### Adjustable Duration
Default 5 minutes, but you can set any time (1-15 min) to match your energy level.

---

## Tech Stack

| Area | Technology |
|------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend & Auth | Supabase (PostgreSQL, Auth, RLS, Storage) |
| AI | OpenAI GPT-3.5 (journal summarizer) |
| Voice | Web Speech API (recognition + synthesis) |
| Notifications | Service Worker + Open-Meteo Weather API |
| Deployment | Netlify + GitHub |
| PWA | Manifest + Service Worker |

---

## Local Development

### Prerequisites
- Node.js (for local server, optional - you can use Live Server extension)
- Supabase account (free tier)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/favourosofisan-dev/wellora-mvp.git
   cd wellora-mvp
   ```
