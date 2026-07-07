from qdrant_client import QdrantClient
import os
from dotenv import load_dotenv
import boto3
from qdrant_client.models import Filter, FieldCondition, MatchValue


load_dotenv()

s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION")
)

client = QdrantClient(
    url=os.getenv("QDRANT_ENDPOINT"),
    api_key=os.getenv("QDRANT_API_KEY"),
    prefer_grpc=True
)

COLLECTION_NAME = "hire-help"


def generate_resume_url(file_name):
    return s3.generate_presigned_url(
        "get_object",
        Params={
            "Bucket":os.getenv("AWS_BUCKET_NAME"),
            "Key":f"resumes/{file_name}"
        },
        ExpiresIn=3600
    )


def upload_points(points):
    if not points:
        return
    
    client.upsert(
        collection_name=COLLECTION_NAME,
        points=points,
        wait=True
    )



def search(embedding, session_id):
    print("Semantic Search started")
    
    # 1. Build the strict metadata filter
    search_filter = Filter(
        must=[
            FieldCondition(
                key="session_id",
                match=MatchValue(value=str(session_id))
            )
        ]
    )
    
    # 2. Use the modern query_points interface
    result = client.query_points(
        collection_name=COLLECTION_NAME,
        query=embedding.tolist(),
        query_filter=search_filter,
        limit=10,
        with_payload=True
    )
    print("result found")

    formatted_results = []
    
    # Loop through the nested points list from the Qdrant response
    for res in result.points:
        file_name = "Unknown document"
        
        # Safe extraction directly from Qdrant point payloads
        if res.payload:
            if "file_name" in res.payload:
                file_name = res.payload["file_name"]
            elif "filename" in res.payload:
                file_name = res.payload["filename"]

        # Generate the AWS S3 presigned URL right here in Python
        resume_url = generate_resume_url(file_name)

        # Append clean dictionary structure to return to Flask (which Flask turns into JSON)
        formatted_results.append({
            "id": str(res.id),
            "score": float(res.score) if res.score is not None else 0.0,
            "file_name": file_name,
            "resume_url": resume_url 
        })
        
    return formatted_results