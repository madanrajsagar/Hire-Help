from extract_text import extract
import sys
from embeddings import embedd
from qdrant_upload import search
import os
import json



def jd_ingestion() ->None:
    if len(sys.argv) > 1:
        jd_path = sys.argv[1]

        if not os.path.exists(jd_path):
            print(f"file not found {jd_path}")
            sys.exit(1)
        
        jd_text = extract(jd_path)
        # print(f"Extracted {len(jd_text)} characters")

        embedding = embedd(jd_text)

        if embedding is None:
            print("Embedding generation failed")
            sys.exit(1)

        res = search(embedding)

        print(json.dumps(res))

if __name__ == "__main__":
    jd_ingestion()
