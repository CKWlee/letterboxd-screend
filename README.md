# Letterboxd Screend

> Turn your Letterboxd data export into a personal film analytics dashboard.

Upload your Letterboxd ZIP and get 20+ interactive visualizations — sentiment analysis on your reviews, viewing heatmaps, genre breakdowns, director frequency, rewatch behavior, and a written insights panel that surfaces patterns in your watch history.

**[Live demo →](https://ckwlee.github.io/letterboxd-screend)**

![demo](assets/demo.gif)

---

## Architecture

```
React/Vite (GitHub Pages)
        ↓
FastAPI backend (Google Cloud Run)
        ↓
TMDB API — film metadata enrichment
```

The frontend parses your Letterboxd ZIP export entirely client-side (no data leaves your browser except TMDB enrichment requests). The FastAPI backend handles TMDB API calls so the key never touches the client bundle.

---

## Features

**Analytics tiles**
- Sentiment analysis on review text (positive/negative/neutral scoring)
- D3.js word cloud from review language
- Calendar heatmap of viewing activity
- Genre and decade breakdowns
- Director and actor frequency charts
- Rewatch behavior and rating drift analysis
- Viewing streaks and binge session detection
- Logging lag — time between watching and logging
- Prime time — what time of day you watch most

**Insights panel**
Written analytical observations generated from your data — things like:
- "You give rewatched films 0.4★ lower on second viewing"
- "Horror is your most-logged genre but your lowest-rated"
- "You log 62% of films the same day you watch them"

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React, Vite, D3.js, Recharts, sentiment.js |
| Data parsing | PapaParse, JSZip |
| Backend | FastAPI, Python 3.11 |
| Metadata | TMDB API |
| Frontend hosting | GitHub Pages |
| Backend hosting | Google Cloud Run (us-central1) |
| CI/CD | GitHub Actions |

---

## Local development

**Frontend**
```bash
npm install
npm run dev
```

Create a `.env` file in the root:
```
VITE_API_URL=http://localhost:8000
```

**Backend**
```bash
cd server
pip install -r requirements.txt
uvicorn main:app --reload
```

Create a `server/.env` file:
```
TMDB_API_KEY=your_tmdb_api_key_here
```

---

## Deploy your own

**Backend** — deploy to Google Cloud Run:
```bash
cd server
gcloud run deploy letterboxd-screend-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars TMDB_API_KEY=your_key_here
```

**Frontend** — add `VITE_API_URL` as a GitHub Actions secret pointing to your Cloud Run URL. Push to `main` to trigger auto-deploy.

---

## License

MIT