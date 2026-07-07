from sentence_transformers import SentenceTransformer

model = SentenceTransformer("BAAI/bge-small-en-v1.5")

def embedd(text : str):
    return model.encode(text, normalize_embeddings=True)


