import React from 'react';

type KeyboardProps = {
  onKeyPress: (key: string) => void;
  keyboardColors: Record<string, string>;
};

const ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['Enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'Backspace']
];

export const Keyboard: React.FC<KeyboardProps> = ({ onKeyPress, keyboardColors }) => {
  return (
    <div className="keyboard-cont">
      {ROWS.map((row, rowIndex) => (
        <div key={`kbd-row-${rowIndex}`} className="keyboard-row">
          {row.map((key) => {
            const isLarge = key === 'Enter' || key === 'Backspace';
            const displayKey = key === 'Backspace' ? 'Del' : key;
            const bgColor = keyboardColors[key] || '';

            return (
              <button
                key={key}
                className={`keyboard-button ${isLarge ? 'large' : ''}`}
                style={{ backgroundColor: bgColor }}
                onClick={() => onKeyPress(key)}
              >
                {displayKey}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};
