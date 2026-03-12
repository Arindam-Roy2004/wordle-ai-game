import { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

let openai: OpenAI | null = null;
if (apiKey) {
  openai = new OpenAI({
    apiKey: apiKey,
  });
}

const geminiApiKey = process.env.GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;
if (geminiApiKey) {
  genAI = new GoogleGenerativeAI(geminiApiKey);
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 5;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }


  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const ipStr = Array.isArray(ip) ? ip[0] : ip;

  if (ipStr !== 'unknown') {
    const now = Date.now();
    const limitInfo = rateLimitMap.get(ipStr);

    if (limitInfo) {
      if (now > limitInfo.resetTime) {

        rateLimitMap.set(ipStr, { count: 1, resetTime: now + WINDOW_MS });
      } else {
        if (limitInfo.count >= MAX_REQUESTS) {
          return res.status(429).json({ error: 'Too Many Requests, please wait and try again.' });
        }
        limitInfo.count += 1;
      }
    } else {
      rateLimitMap.set(ipStr, { count: 1, resetTime: now + WINDOW_MS });
    }
  }

  const { word, hintNumber = 1, genre = '' } = req.body;

  if (!word || typeof word !== 'string' || word.trim() === '') {
    return res.status(400).json({ error: "Word is required." });
  }

  const cleanWord = word.trim();
  const genreContext = genre ? `The word belongs to the "${genre}" category. Use this context to make your hint more relevant.` : '';

  const systemPrompt = `You are a word-guessing hint generator for a Wordle-style game. ${genreContext}

You MUST follow these rules STRICTLY:
1. NEVER reveal the target word in any form.
2. NEVER say "the word is", "the answer is", "hint for the word", or anything that references the word directly.
3. BE EXTREMELY BRIEF. Give short, punchy, creative responses.
4. Return ONLY the raw hint text — NO conversational filler (e.g. no "Here is a hint:", "Sure!", etc).
5. ABSOLUTE MAXIMUM length is 2 sentences. Max 1-2 lines. No fluff.
6. CRITICAL: The exact letters of the secret word must NOT appear sequentially in your answer.`;

  let prompt = '';
  if (hintNumber === 1) {
    // Level 1: Normal, vague genre-aware clue
    prompt = `Give a short, vague 1-sentence clue about the meaning or typical use of the word "${cleanWord}"${genre ? ` within the context of ${genre}` : ''}. Be creative but keep it general enough to not give it away. DO NOT include the word itself.`;
  } else if (hintNumber === 2) {
    // Level 2: Synonyms, associations, related words
    prompt = `For the word "${cleanWord}"${genre ? ` (in the context of ${genre})` : ''}, provide 2-3 synonyms, closely related words, or strong associations as a short comma-separated list. DO NOT include the actual word. Keep it to one line.`;
  } else {
    // Level 3: Riddle that reveals one important letter
    prompt = `Write a 1-sentence riddle about the word "${cleanWord}" that cleverly hints at one important letter of the word (like its starting letter or a distinctive letter). Frame it as a fun puzzle. DO NOT reveal the full word itself.`;
  }
  const MAX_RETRIES = 3;
  let hint = "";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      let usedGemini = false;

      if (genAI) {
        try {
          const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
          });

          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            systemInstruction: systemPrompt,
            generationConfig: {
              maxOutputTokens: 300,
              temperature: 0.8 + (attempt * 0.1),
            }
          });

          hint = result.response.text().trim();
          usedGemini = true;
        } catch (geminiError) {
          console.error(`Gemini API error on attempt ${attempt}:`, geminiError);
        }
      }

      if (!usedGemini) {
        if (!openai) {
          return res.status(200).json({
            hint: "[MOCK HINT] Please add your GEMINI_API_KEY or OPENAI_API_KEY to the root .env file to enable real hints! Example hint: I am red, round, and crunchy."
          });
        }

        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          max_tokens: 60,
          temperature: 0.8 + (attempt * 0.1),
        });

        hint = response.choices[0]?.message?.content?.trim() || "No hint generated.";
      }


      const normalizedHint = hint.toLowerCase().replace(/[^a-z]/g, '');
      const normalizedWord = cleanWord.toLowerCase();

      if (!hint || hint === "No hint generated.") {
        throw new Error("Empty or default hint generated.");
      }

      if (normalizedHint.includes(normalizedWord)) {
        console.warn(`[Attempt ${attempt}] AI hallucinated the answer in the hint. Retrying...`);
        hint = "";
        continue;
      }


      return res.status(200).json({ hint: hint });

    } catch (error: any) {
      console.error(`API error on attempt ${attempt}:`, error);
      if (attempt === MAX_RETRIES) {
        return res.status(500).json({ error: `API error after ${MAX_RETRIES} attempts: ${error.message} ` });
      }
    }
  }


  return res.status(200).json({
    hint: "I'm having a hard time thinking of a hint that doesn't just give the answer away!"
  });
}
