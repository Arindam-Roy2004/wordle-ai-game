# wordle
my own wordle game built from scratch because youtube wouldn't stop showing me wordle videos

## what is this
a full-featured wordle clone with genre-based word categories, AI-powered hints, sound effects, confetti, and a 5-minute timer to keep things spicy. pick a genre, guess the 5-letter word in 6 tries, and try not to rage quit.

## why i built this
i have seen so many wordle game videos on youtube that my recommendations were literally 90% wordle content 😭. at some point i was like "okay i've watched enough of these, let me just build my own." so here we are. instead of watching other people guess words, now i guess words in my own game. productivity at its finest.

## features it has

### 🎲 genre system (13 categories)
not just random words — pick a genre that fits your vibe:
- 🌿 Nature & Wildlife
- 🍕 The Kitchen
- 🏠 The Modern Home
- 💻 Tech & Coding
- ✈️ Travel & Geography
- ⚽ Sports & Fitness
- 💭 Emotions & Feelings
- ⚡ Action Verbs
- 🔬 Science & Space
- 🎵 Music & Sound
- 👗 Fashion & Style
- 📚 School & Learning
- 🎲 Mixed (a bit of everything)

### 🧠 AI-powered hints
- 3 hints per game, each one gives a different type of clue (riddle, usage example, rhyme)
- powered by google gemini / openai so the hints are actually clever and not just "it starts with S"
- smart enough to never accidentally reveal the answer

### 🎮 gameplay
- classic 6 guesses, 5-letter words
- color-coded feedback (🟩 green = right spot, 🟨 yellow = wrong spot, ⬜ gray = nope)
- 5-minute timer per round so you can't sit there forever
- progressive difficulty — words get harder as you win more rounds
- round system that tracks your streak within a genre

### 🔊 sounds & vibes
- custom sound effects for everything (key press, submit, win, error, quit)
- all generated with Web Audio API — no audio files needed
- win chime hits different ngl
- confetti explosion when you win 🎉

### ⌨️ keyboard
- on-screen keyboard with live color updates
- physical keyboard support too obviously

## tech
- react + vite
- typescript
- vercel serverless functions (for the AI hint API)
- canvas-confetti
- web audio API
- toastr for notifications
- animate.css for tile animations

## how to run locally
```bash
git clone <repo-url>
cd wordle
npm install
npm run dev
```

## env setup
you'll need API keys for the hint system to work:
```
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
```

## notes
built this purely because youtube algorithm broke my brain with wordle content. if you're also a wordle video addict, maybe building your own will cure you too (it didn't cure me but at least now i have a cool project).

feel free to fork it, play it, or add your own word genres!
