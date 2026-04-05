import asyncio
import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx

load_dotenv()

app = FastAPI(title="Letterboxd Screend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your GitHub Pages URL in production
    allow_methods=["GET"],
    allow_headers=["*"],
)

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
TMDB_BASE = "https://api.themoviedb.org/3"
SHORT_FILM_THRESHOLD = 40  # minutes


async def tmdb_get(client: httpx.AsyncClient, path: str, params: dict = {}) -> dict:
    if not TMDB_API_KEY:
        raise HTTPException(status_code=500, detail="TMDB_API_KEY not configured")
    r = await client.get(f"{TMDB_BASE}{path}", params={"api_key": TMDB_API_KEY, **params})
    r.raise_for_status()
    return r.json()


@app.get("/enrich")
async def enrich_movie(title: str, year: Optional[int] = None):
    """
    Given a film title (and optional release year), returns TMDB metadata:
    director, genres, cast, production countries, runtime.
    Returns 404 if not found or if it's a short film.
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        # Step 1: search
        params = {"query": title}
        if year:
            params["year"] = year
        search = await tmdb_get(client, "/search/movie", params)
        results = search.get("results", [])
        if not results:
            raise HTTPException(status_code=404, detail=f"No TMDB result for '{title}'")

        tmdb_id = results[0]["id"]

        # Step 2: details + credits in parallel
        details_resp, credits_resp = await asyncio.gather(
            tmdb_get(client, f"/movie/{tmdb_id}"),
            tmdb_get(client, f"/movie/{tmdb_id}/credits"),
        )

        runtime = details_resp.get("runtime")
        if runtime and runtime < SHORT_FILM_THRESHOLD:
            raise HTTPException(status_code=422, detail=f"Short film excluded: {title} ({runtime} min)")

        director = next(
            (p["name"] for p in credits_resp.get("crew", []) if p.get("job") == "Director"),
            "Unknown",
        )
        genres = [g["name"] for g in details_resp.get("genres", [])]
        cast = [
            {"name": a["name"], "profile_path": a.get("profile_path")}
            for a in credits_resp.get("cast", [])
            if a.get("known_for_department") == "Acting"
            and "voice" not in (a.get("character") or "").lower()
        ]
        countries = [c["iso_3166_1"] for c in details_resp.get("production_countries", [])]

        return {
            "tmdb_id": tmdb_id,
            "director": director,
            "genres": genres,
            "cast": cast,
            "countries": countries,
            "runtime": runtime,
        }


@app.get("/health")
async def health():
    return {"status": "ok"}



