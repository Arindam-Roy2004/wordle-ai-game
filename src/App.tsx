import { useState, useEffect, useCallback } from 'react';
import * as toastr from 'toastr';
import 'toastr/build/toastr.min.css';
import 'animate.css';

import { WORDS } from './utils/words';
import { GameBoard } from './components/GameBoard';
import { Keyboard } from './components/Keyboard';

const NUMBER_OF_GUESSES = 6;

function App() {
  const [rightGuessString, setRightGuessString] = useState<string>('');
  const [guesses, setGuesses] = useState<string[][]>(Array(NUMBER_OF_GUESSES).fill([]));
  const [colors, setColors] = useState<string[][]>(Array(NUMBER_OF_GUESSES).fill([]));
  const [currentGuessIndex, setCurrentGuessIndex] = useState(0);
  const [keyboardColors, setKeyboardColors] = useState<Record<string, string>>({});
  const [hint, setHint] = useState<string>('');
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minute timer

  const resetGame = useCallback(() => {
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    setRightGuessString(randomWord);
    setGuesses(Array(NUMBER_OF_GUESSES).fill([]));
    setColors(Array(NUMBER_OF_GUESSES).fill([]));
    setCurrentGuessIndex(0);
    setKeyboardColors({});
    setHint('');
    setIsGameFinished(false);
    setTimeLeft(300); // Reset timer
    console.log("Answer:", randomWord);
  }, []);

  useEffect(() => {
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
      toastr.error("Not enough letters");
      return;
    }

    const guessString = currentGuess.join('');
    if (!WORDS.includes(guessString)) {
      toastr.error("Word not found");
      return;
    }

    let rightGuessCopy = rightGuessString.split('');
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
      setTimeout(() => {
        toastr.success("You guessed right!");
        resetGame();
      }, 1500);
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
  }, [guesses, colors, currentGuessIndex, rightGuessString, keyboardColors, isGameFinished]);

  const onKeyPress = useCallback((key: string) => {
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
  }, [insertKey, deleteLetter, checkGuess]);

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      onKeyPress(e.key);
    };
    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, [onKeyPress]);

  const handleGetHint = async () => {
    if (!rightGuessString) return;
    setIsLoadingHint(true);
    setHint("Fetching hint...");

    try {
      // In production or via Vite proxy, it calls the Vercel serverless function
      const res = await fetch('/api/get_hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: rightGuessString }),
      });
      const data = await res.json();
      if (res.ok && data.hint) {
        setHint(data.hint);
      } else {
        setHint(`Error: ${data.detail || data.error}`);
      }
    } catch (err: any) {
      setHint(`Fetch error: ${err.message}`);
    } finally {
      setIsLoadingHint(false);
    }
  };

  return (
    <div>
      <h1>Wordle Clone</h1>

      <GameBoard
        guesses={guesses}
        colors={colors}
        currentGuessIndex={currentGuessIndex}
      />

      <Keyboard
        keyboardColors={keyboardColors}
        onKeyPress={onKeyPress}
      />

      <div className="hint-section" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          className="hint-btn"
          onClick={handleGetHint}
          disabled={isLoadingHint || isGameFinished}
        >
          {isLoadingHint ? 'WAIT...' : 'GET HINT'}
        </button>
        <button
          className="hint-btn"
          onClick={resetGame}
          style={{ backgroundColor: '#ff3b30' }}
        >
          NEW GAME
        </button>
        {hint && <p className="hint-text" style={{ width: '100%' }}>{hint}</p>}
      </div>
    </div>
  );
}

export default App;
