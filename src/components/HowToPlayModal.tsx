import React, { useEffect } from 'react';
import './HowToPlayModal.css';

interface Props {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<Props> = ({ onClose }) => {
  useEffect(() => {
    // Disable body scrolling when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      // Re-enable body scrolling when modal is closed
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="htp-overlay" onClick={onClose}>
      <div className="htp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="htp-header">
          <h2>HOW TO PLAY</h2>
          <button className="htp-close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="htp-content">
          <p>Guess the hidden word in 6 tries.</p>
          <br />
          <p>Each guess must be a valid 5 letter word, you cannot enter random letters.</p>
          <p>Hit the enter button to submit the guess.</p>
          <br />
          <p>After your submission, the color of the tiles will change as in the examples below.</p>

          <hr className="htp-divider" />

          <h3 className="htp-examples-title">Examples</h3>

          <div className="htp-example">
            <div className="htp-word">
              <div className="htp-tile htp-correct">G</div>
              <div className="htp-tile">A</div>
              <div className="htp-tile">M</div>
              <div className="htp-tile">E</div>
              <div className="htp-tile">S</div>
            </div>
            <p>The letter <strong>G</strong> is in the word and in the correct spot.</p>
          </div>

          <div className="htp-example">
            <div className="htp-word">
              <div className="htp-tile">H</div>
              <div className="htp-tile htp-present">O</div>
              <div className="htp-tile">T</div>
              <div className="htp-tile">E</div>
              <div className="htp-tile">L</div>
            </div>
            <p>The letter <strong>O</strong> is in the word but in the wrong spot.</p>
          </div>

          <div className="htp-example">
            <div className="htp-word">
              <div className="htp-tile">C</div>
              <div className="htp-tile">L</div>
              <div className="htp-tile">I</div>
              <div className="htp-tile htp-absent">C</div>
              <div className="htp-tile">K</div>
            </div>
            <p>The letter <strong>C</strong> is not in the word in any spot.</p>
          </div>

          <hr className="htp-divider" />

          <p className="htp-footer-text"><strong>Unlimited wordle games all day long!</strong></p>
        </div>
      </div>
    </div>
  );
};
