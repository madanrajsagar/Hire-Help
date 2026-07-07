import os
import sys
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

# We strictly enforce a clear text property structure 
class DebuzzResponse(BaseModel):
    expanded_definitions: str = Field(
        description="A list or descriptive paragraph detailing the concrete technical meanings, keywords, and skills hidden beneath the buzzwords found in the JD."
    )

def debuzz_job_description(jd_text: str) -> str:
    """
    Analyzes the JD for buzzwords, generates their clear technical meanings, 
    and appends those meanings to the original text for dual-vector enhancement.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Warning: GEMINI_API_KEY missing. Appending nothing.", flush=True)
        return jd_text

    client = genai.Client()

    prompt = f"""
    You are an expert technical HR Recruiter. Look at this raw Job Description:
    ---
    {jd_text}
    ---
    
    Identify all the vague corporate fluff, buzzwords, or idioms used (e.g., "rockstar", "cutting-edge cloud native ecosystem", "synergy driver"). 
    
    For those words, create an engineering-focused expansion explaining exactly what real-world technologies, architectures, frameworks, or soft skills they mean in standard industry terms.
    
    Format your response as a dense, high-signal technical paragraph or list containing only those technical keywords and definitions. Do not include introductory phrases.
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=DebuzzResponse,
                temperature=0.3
            ),
        )
        
        import json
        data = json.loads(response.text)
        definitions = data.get("expanded_definitions", "")
        
        # ⚡ THE KEY STRATEGY: Keep the entire original text intact, and append the technical payload
        if definitions:
            enriched_text = f"{jd_text}\n\n[Technical Keyword Expansion & Context Definitions]:\n{definitions}"
            return enriched_text
        
        return jd_text

    except Exception as e:
        print(f"Warning: Gemini keyword addition failed ({str(e)}). Using raw text.", flush=True)
        return jd_text

# --- Quick Test Block ---
if __name__ == "__main__":
    sample = "Looking for a rockstar cloud wizard to drive paradigm shifts."
    print("--- Processed Output ---")
    print(debuzz_job_description(sample))