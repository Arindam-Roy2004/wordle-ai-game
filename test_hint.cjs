const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const word = "eagle";
const genre = "Nature & Wildlife";

const genreContext = `The word belongs to the "${genre}" category. Use this context to make your hint more relevant.`;

const systemPrompt = `You are a word-guessing hint generator for a Wordle-style game. ${genreContext}

You MUST follow these rules STRICTLY:
1. NEVER reveal the target word in any form.
2. NEVER say "the word is", "the answer is", "hint for the word", or anything that references the word directly.
3. BE EXTREMELY BRIEF. Give short, punchy, creative responses.
4. Return ONLY the raw hint text — NO conversational filler (e.g. no "Here is a hint:", "Sure!", etc).
5. ABSOLUTE MAXIMUM length is 2 sentences. Max 1-2 lines. No fluff.
6. CRITICAL: The exact letters of the secret word must NOT appear sequentially in your answer.`;

const prompts = [
  // Level 1: Normal, vague genre-aware clue
  `Give a short, vague 1-sentence clue about the meaning or typical use of the word "${word}" within the context of ${genre}. Be creative but keep it general enough to not give it away. DO NOT include the word itself.`,
  // Level 2: Synonyms, associations, related words
  `For the word "${word}" (in the context of ${genre}), provide 2-3 synonyms, closely related words, or strong associations as a short comma-separated list. DO NOT include the actual word. Keep it to one line.`,
  // Level 3: Riddle that reveals one important letter
  `Write a 1-sentence riddle about the word "${word}" that cleverly hints at one important letter of the word (like its starting letter or a distinctive letter). Frame it as a fun puzzle. DO NOT reveal the full word itself.`
];

const labels = ["💡 CLUE", "🔗 RELATED", "🧩 RIDDLE"];

async function test() {
  console.log(`Testing hints for word: "${word}" | Genre: "${genre}"\n`);

  for (let i = 0; i < prompts.length; i++) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompts[i] }] }],
        systemInstruction: systemPrompt,
        generationConfig: { maxOutputTokens: 300, temperature: 0.9 }
      });
      const hint = result.response.text().trim();
      const leaked = hint.toLowerCase().replace(/[^a-z]/g, "").includes(word);
      console.log(`${labels[i]}: ${hint}`);
      console.log(`  Leaked word? ${leaked ? "YES (would retry)" : "NO (safe)"}`);
      console.log();
    } catch (e) {
      console.log(`${labels[i]} ERROR: ${e.message}`);
    }
  }
}

test();
