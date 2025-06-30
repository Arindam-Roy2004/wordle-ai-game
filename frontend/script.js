import { WORDS } from "./words.js";
document.addEventListener('DOMContentLoaded', () => {
    const NUMBER_OF_GUESSES = 6;
    let guessesRemaining = NUMBER_OF_GUESSES;
    let currentGuess = [];
    let nextLetter = 0;
    let rightGuessString = WORDS[Math.floor(Math.random() * WORDS.length)]
    console.log(rightGuessString)
    let rightGuess = rightGuessString.split('');
    // console.log(rightGuess)

    function initBoard() {
        let board = document.getElementById("game-board");

        for (let i = 0; i < NUMBER_OF_GUESSES; i++) {
            let row = document.createElement("div")
            row.className = "letter-row"

            for (let j = 0; j < 5; j++) {
                let box = document.createElement("div")
                box.className = "letter-box"
                row.appendChild(box)
            }

            board.appendChild(row)
        }
    }

    initBoard()

    document.addEventListener('keyup', (event) => {
        if (guessesRemaining === 0) return;

        let pressedKey = String(event.key);
        // console.log(typeof pressedKey) // The type will be "string"
        if (pressedKey === "Backspace" && nextLetter > 0) {
            deleteLetter();
            return;
        }
        if (pressedKey === "Enter") {
            checkGuess();
            return;
        }
        let found = pressedKey.match(/[a-z]/gi);
        if (!found || found.length > 1) {
            return;
        }
        else {
            insertKey(pressedKey);
        }
    });
    function insertKey(pressedKey) {
        if (nextLetter === 5) {
            return;
        }
        let row = document.getElementsByClassName("letter-row")[NUMBER_OF_GUESSES - guessesRemaining];
        let box = row.children[nextLetter];
        animateCSS(box, "pulse")
        box.textContent = pressedKey;
        box.classList.add("filled-box");
        currentGuess.push(pressedKey);
        nextLetter++;
    }
    function deleteLetter() {
        let row = document.getElementsByClassName("letter-row")[NUMBER_OF_GUESSES - guessesRemaining];
        let box = row.children[nextLetter - 1];
        box.textContent = "";
        box.classList.remove("filled-box");
        nextLetter--;
        currentGuess.pop();
    }

    function checkGuess() {
        let row = document.getElementsByClassName("letter-row")[NUMBER_OF_GUESSES - guessesRemaining];
        let guessString = '';
        currentGuess.forEach((letter) => {
            guessString += letter;
        });
        if (guessString.length !== 5) {
            toastr.error("Not enough letters");
            return;
        }
        if (!WORDS.includes(guessString)) {
            toastr.error("Word not found");
            return;
        }
    
        // Make a copy of rightGuess so we don't mutate the original
        let rightGuessCopy = rightGuessString.split('');
    
        // First pass: mark greens
        let letterColors = Array(5).fill('grey');
        for (let i = 0; i < 5; i++) {
            if (currentGuess[i] === rightGuessCopy[i]) {
                letterColors[i] = 'green';
                rightGuessCopy[i] = null; // Mark as used
            }
        }
    
        // Second pass: mark yellows
        for (let i = 0; i < 5; i++) {
            if (letterColors[i] !== 'green') {
                let letterIndex = rightGuessCopy.indexOf(currentGuess[i]);
                if (letterIndex !== -1 && rightGuessCopy[letterIndex] !== null) {
                    letterColors[i] = 'yellow';
                    rightGuessCopy[letterIndex] = null; // Mark as used
                }
            }
        }
    
        for (let i = 0; i < 5; i++) {
            let box = row.children[i];
            let letter = currentGuess[i];
            let letterColor = letterColors[i];
    
            let delay = 250 * i;
            setTimeout(() => {
                animateCSS(box, 'flipInX');
                box.style.backgroundColor = letterColor;
                shadeKeyBoard(letter, letterColor);
            }, delay);
        }
    
        if (guessString === rightGuessString) {
            toastr.success("You guessed right! Game over!")
            guessesRemaining = 0
            return
        }
        else {
            guessesRemaining -= 1;
            currentGuess = [];
            nextLetter = 0;
    
            if (guessesRemaining === 0) {
                toastr.error("You've run out of guesses! Game over!")
                toastr.info(`The right word was: "${rightGuessString}"`)
            }
        }
    }

    function shadeKeyBoard(letter, color) {
        for (const elem of document.getElementsByClassName("keyboard-button")) {
            if (elem.textContent === letter) {
                let oldColor = elem.style.backgroundColor
                if (oldColor === 'green') {
                    return
                }

                if (oldColor === 'yellow' && color !== 'green') {
                    return
                }

                elem.style.backgroundColor = color
                break
            }
        }
    }

    document.getElementById("keyboard-cont").addEventListener("click", (e) => {
        const target = e.target

        if (!target.classList.contains("keyboard-button")) {
            return
        }
        let key = target.textContent

        if (key === "Del") {
            key = "Backspace"
        }

        document.dispatchEvent(new KeyboardEvent("keyup", { 'key': key }))
    })

    const animateCSS = (element, animation, prefix = 'animate__') =>
        // We create a Promise and return it
        new Promise((resolve, reject) => {
            const animationName = `${prefix}${animation}`;
            // const node = document.querySelector(element);
            const node = element
            node.style.setProperty('--animate-duration', '0.3s');

            node.classList.add(`${prefix}animated`, animationName);

            // When the animation ends, we clean the classes and resolve the Promise
            function handleAnimationEnd(event) {
                event.stopPropagation();
                node.classList.remove(`${prefix}animated`, animationName);
                resolve('Animation ended');
            }

            node.addEventListener('animationend', handleAnimationEnd, { once: true });
        });
    document.getElementById('hint-btn').addEventListener('click', async () => {
        // pull your actual answer from wherever you store it
        const answerWord = window.answerWord || 'mango';

        try {
            const res = await fetch('http://localhost:8000/get_hint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word: rightGuessString }),
            });
            const data = await res.json();
            if (res.ok && data.hint) {
                document.getElementById('hint-text').innerText = data.hint;
            } else {
                document.getElementById('hint-text').innerText = `Error: ${data.detail || data.error}`;
            }
        } catch (err) {
            document.getElementById('hint-text').innerText = `Fetch error: ${err.message}`;
        }
    });



});