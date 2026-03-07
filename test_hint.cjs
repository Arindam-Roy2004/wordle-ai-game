const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const word = "apple";
const systemPrompt = "You are a word-guessing hint generator for a Wordle-style game. NEVER reveal the target word. BE EXTREMELY BRIEF. Return ONLY the raw hint text. ABSOLUTE MAXIMUM 2 sentences.";

async function test() {
  const prompts = [
    `Give a very short, clever 1-sentence riddle describing the meaning or origin of: "${word}". DO NOT include the word.`,
    `In 1-2 punchy sentences, describe a common situation or famous setting where: "${word}" is used. DO NOT include the word.`,
    `In 1 short sentence, give a clever rhyming hint or a playful structural clue for: "${word}". DO NOT include the word.`
  ];

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
      console.log(`Hint ${i + 1}: ${hint}`);
      console.log(`  Leaked word? ${leaked ? "YES (would retry)" : "NO (safe)"}`);
      console.log();
    } catch (e) {
      console.log(`Hint ${i + 1} ERROR: ${e.message}`);
    }
  }
}

test();
