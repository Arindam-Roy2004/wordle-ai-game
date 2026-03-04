import React from 'react';

type GameBoardProps = {
  guesses: string[][];
  colors: string[][];
  currentGuessIndex: number;
};

const NUMBER_OF_GUESSES = 6;

export const GameBoard: React.FC<GameBoardProps> = ({
  guesses,
  colors,
  currentGuessIndex,
}) => {
  return (
    <div className="game-board">
      {Array.from({ length: NUMBER_OF_GUESSES }).map((_, rowIndex) => {
        const isCurrentRow = rowIndex === currentGuessIndex;
        const guess = guesses[rowIndex] || [];
        const letterColors = colors[rowIndex] || [];

        return (
          <div key={`row-${rowIndex}`} className="letter-row">
            {Array.from({ length: 5 }).map((_, colIndex) => {
              const letter = guess[colIndex] || "";
              const color = letterColors[colIndex] || "transparent";

              let animationClass = "";
              if (letter && isCurrentRow) {
                animationClass = "animate__animated animate__pulse";
              } else if (color !== "transparent" && !isCurrentRow) {
                animationClass = "animate__animated animate__flipInX";
              }

              return (
                <div
                  key={`box-${rowIndex}-${colIndex}`}
                  className={`letter-box ${letter ? "filled-box" : ""} ${animationClass}`}
                  style={{
                    backgroundColor: color !== "transparent" ? color : "",
                    borderColor: color !== "transparent" ? color : "",
                  }}
                >
                  {letter}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
