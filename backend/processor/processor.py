import sys
import os
import shutil
import zipfile
from extract_text import extract 

from qdrant_client.models import PointStruct
import uuid

from qdrant_upload import upload_points
from embeddings import embedd

points = []

processed_files = []


def path() -> None:
    if len(sys.argv) > 1:
        file_path = sys.argv[1]

        if not os.path.exists(file_path):
            print("file not found : {file_path}")
            sys.exit(1)

        extract_dir = "temp/extracted"

        os.makedirs(extract_dir, exist_ok=True)

        for item in os.listdir(extract_dir):
            item_path = os.path.join(extract_dir, item)

            if os.path.isfile(item_path) or os.path.islink(item_path):
                os.unlink(item_path)
            elif os.path.isdir(item_path):
                shutil.rmtree(item_path)
                
        #print("Old data removed")

        #print("python -> ",file_path)
   

    #extraction
    # print("text extraction")
    with zipfile.ZipFile(file_path, "r") as zip_ref:
        zip_ref.extractall(extract_dir)
    # print(f"zip extracted at {extract_dir}")

    new_path = ""
    for item in os.listdir(extract_dir):
        new_path = os.path.join(extract_dir, item)
        break
    
    for filename in os.listdir(new_path):
        path_file = os.path.join(new_path, filename)


        text = extract(path_file)

        processed_files.append(path_file)

        embeddings =  embedd(text)
        

        point = PointStruct(
            id=str(uuid.uuid4()),
            vector=embeddings.tolist(),
            payload={
                "file_name": filename
            }
        )
        points.append(point)
    
    upload_points(points)

    


if __name__ == "__main__":

    path()

    for file in processed_files:
        os.remove(file)

    

