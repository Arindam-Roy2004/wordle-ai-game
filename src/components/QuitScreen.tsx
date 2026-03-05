import './QuitScreen.css';

interface QuitScreenProps {
  word: string;
  onNewGame: () => void;
}

export function QuitScreen({ word, onNewGame }: QuitScreenProps) {
  return (
    <div className="quit-screen">
      <h1 className="quit-title">GAME OVER</h1>

      <span className="quit-subtitle">The word was</span>

      <div className="quit-word-row">
        {word.split('').map((letter, i) => (
          <div className="quit-tile" key={i}>
            {letter}
          </div>
        ))}
      </div>

      <button className="quit-start-btn" onClick={onNewGame}>
        ▶ START NEW GAME
      </button>
    </div>
  );
}
