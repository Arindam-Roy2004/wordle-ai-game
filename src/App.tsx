import { useState, useEffect, useCallback, useRef } from 'react';
import * as toastr from 'toastr';
import 'toastr/build/toastr.min.css';
import 'animate.css';
import './App.css';

import { WORDS } from './utils/words';
import { GENRE_WORDS, GENRE_LABELS } from './utils/genreWords';
import type { Genre } from './utils/genreWords';
import { GameBoard } from './components/GameBoard';
import { Keyboard } from './components/Keyboard';
import { QuitScreen } from './components/QuitScreen';
import { GenreScreen } from './components/GenreScreen';
import { playKeyPress, playDelete, playSubmit, playWin, playError, playHint, playQuit, playStartGame } from './utils/sounds';
import { fireConfetti } from './utils/confetti';

const NUMBER_OF_GUESSES = 6;

function App() {
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [rightGuessString, setRightGuessString] = useState<string>('');
  const [guesses, setGuesses] = useState<string[][]>(Array(NUMBER_OF_GUESSES).fill([]));
  const [colors, setColors] = useState<string[][]>(Array(NUMBER_OF_GUESSES).fill([]));
  const [currentGuessIndex, setCurrentGuessIndex] = useState(0);
  const [keyboardColors, setKeyboardColors] = useState<Record<string, string>>({});
  const [hint, setHint] = useState<string>('');
  const [hintsLeft, setHintsLeft] = useState(3);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [hasQuit, setHasQuit] = useState(false);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minute timer
  const roundRef = useRef(1);

  const resetGame = useCallback((genre?: Genre) => {
    const activeGenre = genre || selectedGenre;
    // Use genre-specific words if a genre is selected; 'mixed' falls back to general list
    const wordPool = (activeGenre && activeGenre !== 'mixed') ? GENRE_WORDS[activeGenre] : WORDS;

    // Progressive difficulty: pick words from harder portions as rounds increase
    const totalWords = wordPool.length;
    const easyEnd = Math.floor(totalWords / 3);       // ~first 1/3 (common words)
    const mediumEnd = Math.floor((totalWords * 2) / 3); // ~first 2/3

    let poolEnd: number;
    if (roundRef.current <= 3) {
      poolEnd = easyEnd;        // Rounds 1-3: easy, common words
    } else if (roundRef.current <= 6) {
      poolEnd = mediumEnd;      // Rounds 4-6: medium difficulty
    } else {
      poolEnd = totalWords;     // Rounds 7+: full word list
    }

    const randomWord = wordPool[Math.floor(Math.random() * poolEnd)];
    setRightGuessString(randomWord);
    setGuesses(Array(NUMBER_OF_GUESSES).fill([]));
    setColors(Array(NUMBER_OF_GUESSES).fill([]));
    setCurrentGuessIndex(0);
    setKeyboardColors({});
    setHint('');
    setHintsLeft(3);
    setIsGameFinished(false);
    setHasQuit(false);
    setTimeLeft(300); // Reset timer
    toastr.clear(); // Clear any lingering toasts when restarting
    roundRef.current += 1;
    console.log("Answer:", randomWord, "| Round:", roundRef.current);
  }, [selectedGenre]);

  useEffect(() => {
    toastr.options.positionClass = 'toast-top-center';
    toastr.options.preventDuplicates = true;
    toastr.options.timeOut = 3000;
    resetGame();
  }, [resetGame]);

  useEffect(() => {
    if (isGameFinished) return;

    if (timeLeft <= 0) {
      setIsGameFinished(true);
      toastr.error("Time's up! Game over!");
      toastr.info(`The right word was: "${rightGuessString}"`);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isGameFinished, rightGuessString]);

  const insertKey = useCallback((key: string) => {
    if (isGameFinished || currentGuessIndex >= NUMBER_OF_GUESSES) return;

    const currentGuess = [...guesses[currentGuessIndex]];
    if (currentGuess.length < 5) {
      playKeyPress();
      currentGuess.push(key);
      const newGuesses = [...guesses];
      newGuesses[currentGuessIndex] = currentGuess;
      setGuesses(newGuesses);
    }
  }, [guesses, currentGuessIndex, isGameFinished]);

  const deleteLetter = useCallback(() => {
    if (isGameFinished || currentGuessIndex >= NUMBER_OF_GUESSES) return;

    const currentGuess = [...guesses[currentGuessIndex]];
    if (currentGuess.length > 0) {
      playDelete();
      currentGuess.pop();
      const newGuesses = [...guesses];
      newGuesses[currentGuessIndex] = currentGuess;
      setGuesses(newGuesses);
    }
  }, [guesses, currentGuessIndex, isGameFinished]);

  const checkGuess = useCallback(() => {
    if (isGameFinished || currentGuessIndex >= NUMBER_OF_GUESSES) return;

    const currentGuess = guesses[currentGuessIndex];
    if (currentGuess.length < 5) {
      playError();
      toastr.error("Not enough letters");
      return;
    }

    const guessString = currentGuess.join('');
    const activeWordPool = (selectedGenre && selectedGenre !== 'mixed') ? GENRE_WORDS[selectedGenre] : WORDS;
    if (!activeWordPool.includes(guessString) && !WORDS.includes(guessString)) {
      playError();
      toastr.error("Word not found");
      return;
    }

    playSubmit();

    const rightGuessCopy = rightGuessString.split('');
    const newColors = Array(5).fill('transparent');

    // First pass: mark greens
    for (let i = 0; i < 5; i++) {
      if (currentGuess[i] === rightGuessCopy[i]) {
        newColors[i] = '#538d4e'; // green
        rightGuessCopy[i] = ''; // nullify
      }
    }

    // Second pass: mark yellows
    for (let i = 0; i < 5; i++) {
      if (newColors[i] !== '#538d4e') {
        const letterIndex = rightGuessCopy.indexOf(currentGuess[i]);
        if (letterIndex !== -1 && rightGuessCopy[letterIndex] !== '') {
          newColors[i] = '#b59f3b'; // yellow
          rightGuessCopy[letterIndex] = ''; // nullify
        } else {
          newColors[i] = '#3a3a3c'; // grey
        }
      }
    }

    const updatedColors = [...colors];
    updatedColors[currentGuessIndex] = newColors;
    setColors(updatedColors);

    // Update keyboard colors
    const newKeyboardColors = { ...keyboardColors };
    for (let i = 0; i < 5; i++) {
      const letter = currentGuess[i];
      const color = newColors[i];
      const oldColor = newKeyboardColors[letter];

      if (oldColor === '#538d4e') continue;
      if (oldColor === '#b59f3b' && color !== '#538d4e') continue;

      newKeyboardColors[letter] = color;
    }
    setKeyboardColors(newKeyboardColors);

    if (guessString === rightGuessString) {
      playWin();
      fireConfetti();
      toastr.success("You guessed right!");

      setTimeout(() => {
        resetGame();
      }, 3000);
      setIsGameFinished(true);
      return;
    }

    if (currentGuessIndex === NUMBER_OF_GUESSES - 1) {
      setTimeout(() => {
        toastr.error("You've run out of guesses! Game over!");
        toastr.info(`The right word was: "${rightGuessString}"`);
      }, 1500);
      setIsGameFinished(true);
    } else {
      setCurrentGuessIndex(currentGuessIndex + 1);
    }
  }, [guesses, colors, currentGuessIndex, rightGuessString, keyboardColors, isGameFinished, resetGame]);

  const onKeyPress = useCallback((key: string) => {
    if (!selectedGenre || hasQuit) return;

    if (key === 'Backspace' || key === 'Del') {
      deleteLetter();
    } else if (key === 'Enter') {
      checkGuess();
    } else {
      const found = key.match(/^[a-z]$/i);
      if (found) {
        insertKey(key.toLowerCase());
      }
    }
  }, [insertKey, deleteLetter, checkGuess, selectedGenre, hasQuit]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent repeated key inputs if key is held down
      if (e.repeat) return;
      onKeyPress(e.key);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onKeyPress]);

  const handleGetHint = async () => {
    if (!rightGuessString || hintsLeft <= 0) return;
    playHint();
    setIsLoadingHint(true);
    setHint("Fetching hint...");

    try {
      const res = await fetch('/api/get_hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: rightGuessString,
          hintNumber: 4 - hintsLeft
        }),
      });
      const data = await res.json();
      if (res.ok && data.hint) {
        setHint(data.hint);
        setHintsLeft(prev => prev - 1);
      } else {
        setHint(`Error: ${data.detail || data.error}`);
      }
    } catch (err: any) {
      setHint(`Fetch error: ${err.message}`);
    } finally {
      setIsLoadingHint(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Show genre selection screen if no genre is selected yet
  if (!selectedGenre) {
    return <GenreScreen onStart={(genre) => { setSelectedGenre(genre); resetGame(genre); }} />;
  }

  if (hasQuit) {
    return <QuitScreen word={rightGuessString} onNewGame={() => { setSelectedGenre(null); }} />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>WORDLE</h1>
        {selectedGenre && GENRE_LABELS[selectedGenre] && (
          <div className="genre-badge" title="Current Genre">
            <span className="genre-icon">{GENRE_LABELS[selectedGenre].emoji}</span>
            <span className="genre-name">{GENRE_LABELS[selectedGenre].label}</span>
          </div>
        )}
        <div className={`timer ${timeLeft <= 60 ? 'timer-warning' : ''}`}>
          <span className="timer-icon">⏱</span>
          <span>{formatTime(timeLeft)}</span>
        </div>
      </header>

      <GameBoard
        guesses={guesses}
        colors={colors}
        currentGuessIndex={currentGuessIndex}
      />

      <Keyboard
        keyboardColors={keyboardColors}
        onKeyPress={onKeyPress}
      />

      <div className="action-section">
        <button
          className="hint-btn"
          onClick={handleGetHint}
          disabled={isLoadingHint || isGameFinished || hintsLeft <= 0}
        >
          {isLoadingHint ? 'WAIT...' : `GET HINT (${hintsLeft})`}
        </button>
        <button
          className="hint-btn quit-btn"
          onClick={() => {
            playQuit();
            setIsGameFinished(true);
            setHasQuit(true);
          }}
          disabled={isGameFinished}
        >
          QUIT
        </button>
        <button
          className="hint-btn new-game-btn"
          onClick={() => {
            playStartGame();
            resetGame();
          }}
        >
          NEW GAME
        </button>
      </div>
      {hint && <p className="hint-text">{hint}</p>}
    </div>
  );
}

export default App;
