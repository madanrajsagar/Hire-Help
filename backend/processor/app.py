from fastapi import FastAPI
from sentence_transformers import SentenceTransformer

app = FastAPI()

print("Loading embedding model...")
model = SentenceTransformer("BAAI/bge-small-en-v1.5")
print("Model loaded.")