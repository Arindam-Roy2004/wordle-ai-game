import { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAI } from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

let openai: OpenAI | null = null;
if (apiKey) {
  openai = new OpenAI({
    apiKey: apiKey,
  });
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
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

  // Rate limiting logic
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const ipStr = Array.isArray(ip) ? ip[0] : ip;

  if (ipStr !== 'unknown') {
    const now = Date.now();
    const limitInfo = rateLimitMap.get(ipStr);

    if (limitInfo) {
      if (now > limitInfo.resetTime) {
        // Reset window
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

  const { word } = req.body;

  if (!word || typeof word !== 'string' || word.trim() === '') {
    return res.status(400).json({ error: "Word is required." });
  }

  const cleanWord = word.trim();

  const systemPrompt = `You are a word-guessing hint generator for a Wordle-style game. You MUST follow these rules STRICTLY:

1. NEVER reveal the target word in any form — do not write it, spell it, rhyme it with a word that gives it away, or include it as part of another word.
2. NEVER say "the word is", "the answer is", "hint for the word", or anything that references the word directly.
3. Give a short, creative, riddle-style hint that describes the concept, meaning, or usage of the word WITHOUT giving it away.
4. Use simple language a 10-year-old can understand.
5. Return ONLY the hint text — no quotes, no labels, no preamble, no extra commentary.
6. Keep it under 2 sentences.`;

  const prompt = `Give a riddle-style hint for this secret word: "${cleanWord}". Remember: DO NOT reveal the word itself anywhere in your response.`;

  try {
    if (!openai) {
      return res.status(200).json({
        hint: "[MOCK HINT] Please add your OPENAI_API_KEY to the root .env file to enable real hints! Example hint: I am red, round, and crunchy."
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      max_tokens: 60,
      temperature: 0.8,
    });

    const hint = response.choices[0]?.message?.content?.trim() || "No hint generated.";

    return res.status(200).json({ hint: hint });

  } catch (error: any) {
    console.error("OpenAI API error:", error);
    return res.status(500).json({ error: `OpenAI API error: ${error.message}` });
  }
}
