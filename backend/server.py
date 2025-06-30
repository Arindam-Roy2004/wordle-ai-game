from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
from openai import OpenAI

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise RuntimeError("OPENAI_API_KEY not found in .env")

client = OpenAI(api_key=api_key)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HintRequest(BaseModel):
    word: str

@app.post("/get_hint")
async def get_hint(request: HintRequest):
    word = request.word.strip()

    if not word:
        raise HTTPException(status_code=400, detail="Word is required.")

    prompt = f"""
    Give a short, creative, and family-friendly riddle-style hint for the English word: '{word}'.
    And, use easy words that a 10-year-old can understand.
    only return the hint without any additional text.
    like eg: "here is a hint for the word 'apple': I am red or green, and I keep doctors away. What am I?"
    only return the hint
    """

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that gives fun, smart, and short word hints."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=50,
            temperature=0.7,
        )

        hint = response.choices[0].message.content.strip()
        return {"hint": hint}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")
