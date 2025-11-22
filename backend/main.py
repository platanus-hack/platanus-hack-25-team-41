import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import google.generativeai as genai

app = FastAPI()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


class PromptRequest(BaseModel):
    prompt: str


@app.get("/")
def read_root():
    return {"message": "Hello World!!"}


@app.post("/generate")
async def generate_content(request: PromptRequest):
    try:
        model = genai.GenerativeModel("gemini-2.0-flash-exp")
        response = model.generate_content(request.prompt)
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
