import { useState, useEffect, useCallback, useRef } from 'react';
import type { Genre } from '../utils/genreWords';
import { GENRE_LABELS } from '../utils/genreWords';
import { playOptionChange, playStartGame } from '../utils/sounds';
import './GenreScreen.css';

interface GenreScreenProps {
  onStart: (genre: Genre) => void;
}

const GENRES = Object.keys(GENRE_LABELS) as Genre[];

export function GenreScreen({ onStart }: GenreScreenProps) {
  const [selected, setSelected] = useState<Genre | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Navigate with arrow keys
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();

      let newIndex = 0;
      if (selected) {
        const currentIndex = GENRES.indexOf(selected);
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          newIndex = (currentIndex + 1) % GENRES.length;
        } else {
          newIndex = (currentIndex - 1 + GENRES.length) % GENRES.length;
        }
      }

      const newSelected = GENRES[newIndex];
      playOptionChange();
      setSelected(newSelected);

      // Try to scroll the selected button into view
      setTimeout(() => {
        const selectedBtn = containerRef.current?.querySelector(`.genre-btn-active`);
        if (selectedBtn) {
          selectedBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);

    } else if (e.key === 'Enter' && selected) {
      e.preventDefault();
      playStartGame();
      onStart(selected);
    }
  }, [selected, onStart]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="genre-screen" ref={containerRef}>
      <h1 className="genre-title">WORDLE</h1>

      <span className="genre-subtitle">Choose a Genre</span>

      <div className="genre-scroll-box">
        <div className="genre-buttons">
          {GENRES.map((g) => (
            <button
              key={g}
              className={`genre-btn ${selected === g ? 'genre-btn-active' : ''}`}
              onClick={() => {
                playOptionChange();
                setSelected(g);
              }}
            >
              {GENRE_LABELS[g].emoji} {GENRE_LABELS[g].label}
            </button>
          ))}
        </div>
      </div>

      <button
        className="genre-start-btn"
        disabled={!selected}
        onClick={() => {
          if (selected) {
            playStartGame();
            onStart(selected);
          }
        }}
      >
        ▶ START GAME
      </button>
    </div>
  );
}
