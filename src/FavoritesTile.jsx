// src/FavoritesTile.jsx
import React from 'react';

// A helper component for displaying a single film
const FilmItem = ({ film }) => (
  <li>
    <span className="film-title">{film.Name}</span>
    <span className="film-year">{film.Year}</span>
  </li>
);

export default function FavoritesTile({ favorites = [], stinkers = [], maxRating = 0, minRating = 0 }) {
  // THE CHANGE IS HERE: We are no longer slicing the arrays.
  // The component will now use the full lists passed in as props.

  return (
    <div className="list-card favorites-tile">
      <h2>Highest & Lowest Rated</h2>
      <div className="favorites-content">
        <div className="list-section">
          <h3>Your Favorites ({maxRating.toFixed(1)} ★)</h3>
          {favorites.length > 0 ? (
            <ul>
              {favorites.map(film => <FilmItem key={film['Letterboxd URI']} film={film} />)}
            </ul>
          ) : (
            <p>No films found.</p>
          )}
        </div>
        <div className="list-section">
          <h3>Your Stinkers ({minRating.toFixed(1)} ★)</h3>
          {stinkers.length > 0 ? (
            <ul>
              {stinkers.map(film => <FilmItem key={film['Letterboxd URI']} film={film} />)}
            </ul>
          ) : (
            <p>No films found.</p>
          )}
        </div>
      </div>
    </div>
  );
}