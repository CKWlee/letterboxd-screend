# letterboxd screend

upload your letterboxd data export and get a full breakdown of your watch history — genre trends, director frequency, sentiment on your reviews, rewatch behavior, and a bunch of other stuff that tells you more about yourself than you probably wanted to know.

**[live demo →](https://ckwlee.github.io/letterboxd-screend)**

![demo](assets/demo.gif)

---

## what it does

drop in your letterboxd ZIP and it generates 20+ tiles:

- sentiment analysis on your written reviews
- word cloud from your review language
- calendar heatmap of when you watch
- genre and decade breakdowns
- director and actor frequency
- rewatch rating drift (do you like things more or less the second time?)
- binge session detection
- how long you wait before logging a film
- an insights panel that writes out actual observations about your habits

no account needed, no data sent anywhere except TMDB for film metadata

---

## how it actually works

```
your browser (React/Vite)
      ↓  parses your ZIP locally
FastAPI backend (Google Cloud Run)
      ↓  enriches with film metadata
TMDB API
```

the frontend does all the heavy lifting client-side. the backend exists so the TMDB API key stays off the client bundle.

---

## stack

| | |
|---|---|
| frontend | React, Vite, D3.js, Recharts, sentiment.js |
| parsing | PapaParse, JSZip |
| backend | FastAPI, Python 3.11 |
| metadata | TMDB API |
| hosting | GitHub Pages (frontend), Google Cloud Run (backend) |
| ci/cd | GitHub Actions |

---

## run it locally

**frontend**
```bash
npm install
npm run dev
```

add a `.env` in the root:
```
VITE_API_URL=http://localhost:8000
```

**backend**
```bash
cd server
pip install -r requirements.txt
uvicorn main:app --reload
```

add a `server/.env`:
```
TMDB_API_KEY=your_key_here
```

---

## deploy your own

backend on Cloud Run:
```bash
cd server
gcloud run deploy letterboxd-screend-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars TMDB_API_KEY=your_key_here
```

frontend auto-deploys via GitHub Actions on push to main. add `VITE_API_URL` as a repo secret pointing to your Cloud Run URL.