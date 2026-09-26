from flask import Flask, request, jsonify
import os
import sys
import shutil
import zipfile
import uuid
import json 
import traceback 
import threading
import time
from concurrent.futures import ThreadPoolExecutor 

from de_buzz import debuzz_job_description

# ⚡ CRITICAL OPTIMIZATION: Stop PyTorch from thrashing shared cloud CPUs
import torch
torch.set_num_threads(1)
torch.set_num_interop_threads(1)

from extract_text import extract 
from sentence_transformers import SentenceTransformer
from qdrant_client.models import PointStruct, Filter, FieldCondition, MatchValue
from qdrant_upload import upload_points, search, client, COLLECTION_NAME

print("Loading sentence-transformer model...", flush=True)
model = SentenceTransformer("BAAI/bge-small-en-v1.5", device="cpu")
print("Model loaded and warm!", flush=True)

app = Flask(__name__)

# --- BLAZING FAST ONCE-AT-STARTUP INDEX INITIALIZATION ---
try:
    print("Verifying Qdrant payload index for session_id...", flush=True)
    client.create_payload_index(
        collection_name=COLLECTION_NAME,
        field_name="session_id",
        field_schema="keyword",
    )
    print("Verifying Qdrant structural numerical index for expire_at...", flush=True)
    client.create_payload_index(
        collection_name=COLLECTION_NAME,
        field_name="expire_at",
        field_schema="integer", 
    )
    print("Qdrant indexes are ready!", flush=True)
except Exception as index_err:
    print(f"Index initialization status: {str(index_err)}", flush=True)


def run_janitor_loop():
    from qdrant_client.models import Filter, FieldCondition, Range
    while True:
        try:
            current_time = int(time.time())
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Janitor sweeping active...", flush=True)
            delete_filter = Filter(
                must=[FieldCondition(key="expire_at", range=Range(lt=current_time))]
            )
            operation_info = client.delete(collection_name=COLLECTION_NAME, points_selector=delete_filter)
            print(f"Sweep status: {operation_info.status}", flush=True)
        except Exception as loop_err:
            print(f"Janitor loop background warning: {str(loop_err)}", flush=True)
        time.sleep(300)


def safe_extract(path_file, filename):
    try:
        text = extract(path_file)
        if text and text.strip():
            return filename, path_file, text
    except Exception as e:
        print(f"Skipping unreadable file {filename}: {str(e)}", flush=True)
    return None


# --- ENDPOINT 1: PROCESS ZIP ---
@app.route('/process-zip', methods=['POST'])
def embedd_zip():
    data = request.get_json()
    file_path = data.get('filePath')
    session_id = data.get('sessionId')

    if not file_path or not os.path.exists(file_path):
        return jsonify({"success": False, "error": "file path invalid"}), 400

    try:
        extract_dir = "temp/extracted"
        if os.path.exists(extract_dir):
            shutil.rmtree(extract_dir)
        os.makedirs(extract_dir, exist_ok=True)
        
        with zipfile.ZipFile(file_path, "r") as zip_ref:
            zip_ref.extractall(extract_dir)

        tasks = []
        new_path = extract_dir
        for item in os.listdir(extract_dir):
            item_path = os.path.join(extract_dir, item)
            if os.path.isdir(item_path) and not item.startswith('.') and item != "__MACOSX":
                new_path = item_path
                break
        
        for filename in os.listdir(new_path):
            path_file = os.path.join(new_path, filename)
            if (os.path.isdir(path_file) or filename.startswith('.') or 
                filename.startswith('._') or filename.startswith('__')):
                continue
            tasks.append((path_file, filename))

        valid_filenames = []
        valid_texts = []

        if tasks:
            with ThreadPoolExecutor(max_workers=4) as executor:
                results = executor.map(lambda t: safe_extract(t[0], t[1]), tasks)
                for res in results:
                    if res:
                        fname, pfile, ftext = res
                        valid_filenames.append(fname)
                        valid_texts.append(ftext)

        if valid_texts:
            all_embeddings = model.encode(valid_texts, batch_size=32, normalize_embeddings=True, show_progress_bar=False)
            expiration_timestamp = int(time.time()) + 3600
            points = []
            for idx, filename in enumerate(valid_filenames):
                points.append(PointStruct(
                    id=str(uuid.uuid4()),
                    vector=all_embeddings[idx].tolist(),
                    payload={
                        "file_name": str(filename),  
                        "session_id": str(session_id),
                        "expire_at": expiration_timestamp
                    }
                ))
            if points:
                # Replace (not append to) this session's earlier resumes so that
                # re-uploading a ZIP never produces duplicate candidates.
                client.delete(
                    collection_name=COLLECTION_NAME,
                    points_selector=Filter(
                        must=[FieldCondition(key="session_id", match=MatchValue(value=str(session_id)))]
                    ),
                    wait=True,
                )
                upload_points(points)

        if os.path.exists(extract_dir):
            shutil.rmtree(extract_dir)
                
        return jsonify({"success": True, "result": {"message": f"Successfully processed {len(valid_filenames)} resumes."}})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# --- ENDPOINT 2: PROCESS JOB DESCRIPTION (OPTIMIZED) ---
# --- ENDPOINT 2: PROCESS JOB DESCRIPTION (OPTIMIZED WITH GEMINI) ---
@app.route('/process-jd', methods=['POST'])
def handle_jd():
    data = request.get_json()
    file_path = data.get('filePath') 
    session_id = data.get('sessionId')
    
    if not file_path or not os.path.exists(file_path):
        return jsonify({"success": False, "error": "JD file path missing or invalid"}), 400

    try:
        start_time = time.time()
        
        print("----> Starting text extraction...", flush=True)
        raw_jd_text = extract(file_path)
        
        # 🚀 THE MAGIC BRIDGE: Feed raw text to Gemini to append technical definitions
        print("----> Contextualizing buzzwords with Gemini...", flush=True)
        jd_text = debuzz_job_description(raw_jd_text)
        
        extract_done_time = time.time()
        print(f"----> Text extraction & expansion finished in: {extract_done_time - start_time:.4f} seconds", flush=True)
        
        print("----> Starting embedding vector encoding...", flush=True)
        embedding = model.encode(jd_text, normalize_embeddings=True, show_progress_bar=False)
        
        embedding_done_time = time.time()
        print(f"----> Embedding matrix generation finished in: {embedding_done_time - extract_done_time:.4f} seconds", flush=True)
        
        if embedding is None:
            return jsonify({"success": False, "error": "Embedding generation failed"}), 500
        
        search_results = search(embedding, session_id)
        print(f"----> Qdrant search completed in: {time.time() - embedding_done_time:.4f} seconds", flush=True)
        
        return jsonify({
            "success": True, 
            "result": search_results
        })
        
    except Exception as e:
        print("!!! EXCEPTION IN /process-jd !!!", flush=True)
        traceback.print_exc(file=sys.stdout)
        sys.stdout.flush()
        return jsonify({"success": False, "error": str(e)}), 500
        
# Fire the background worker safely
threading.Thread(target=run_janitor_loop, daemon=True).start()

if __name__ == "__main__":
    app.run(host='127.0.0.1', port=8000)