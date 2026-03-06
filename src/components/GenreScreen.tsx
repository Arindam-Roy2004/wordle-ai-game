import { useState } from 'react';
import type { Genre } from '../utils/genreWords';
import { GENRE_LABELS } from '../utils/genreWords';
import './GenreScreen.css';

interface GenreScreenProps {
  onStart: (genre: Genre) => void;
}

const GENRES = Object.keys(GENRE_LABELS) as Genre[];

export function GenreScreen({ onStart }: GenreScreenProps) {
  const [selected, setSelected] = useState<Genre | null>(null);

  return (
    <div className="genre-screen">
      <h1 className="genre-title">WORDLE</h1>

      <span className="genre-subtitle">Choose a Genre</span>

      <div className="genre-scroll-box">
        <div className="genre-buttons">
          {GENRES.map((g) => (
            <button
              key={g}
              className={`genre-btn ${selected === g ? 'genre-btn-active' : ''}`}
              onClick={() => setSelected(g)}
            >
              {GENRE_LABELS[g].emoji} {GENRE_LABELS[g].label}
            </button>
          ))}
        </div>
      </div>

      <button
        className="genre-start-btn"
        disabled={!selected}
        onClick={() => selected && onStart(selected)}
      >
        ▶ START GAME
      </button>
    </div>
  );
}
