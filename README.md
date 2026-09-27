# Hire-Help

**AI-powered resume ranking.** Upload a ZIP of resumes, add a job description (JD), and Hire-Help ranks the candidates by how well they match, using semantic search instead of keyword matching.

> Live frontend: <https://hire-help.netlify.app>

---

## Table of contents

1. [What it does](#1-what-it-does)
2. [Architecture](#2-architecture)
3. [How it works (end-to-end flow)](#3-how-it-works-end-to-end-flow)
4. [Tech stack](#4-tech-stack)
5. [Repository structure](#5-repository-structure)
6. [API reference](#6-api-reference)
7. [Environment variables](#7-environment-variables)
8. [Run it locally](#8-run-it-locally)
9. [Deployment](#9-deployment)
10. [Deployment issues we hit and how we fixed them](#10-deployment-issues-we-hit-and-how-we-fixed-them)
11. [Design decisions](#11-design-decisions)
12. [Security notes](#12-security-notes)
13. [Known limitations and roadmap](#13-known-limitations-and-roadmap)

---

## 1. What it does

Recruiters shouldn't have to open 80 PDFs to find the top 5. Hire-Help:

- **Ingests a ZIP** of resumes (PDF or DOCX, up to 100 MB), reads every file and turns each into a vector embedding.
- **De-buzzifies the job description.** Gemini expands vague phrases like "rockstar" or "cloud-native ecosystem" into concrete technical keywords, so the match is on real skills.
- **Ranks candidates** by cosine similarity between the JD and each resume, and shows a colour-coded match score (Strong, Good, Partial).
- **Links to the source resume** through a time-limited (1 hour) presigned S3 URL.
- **Keeps sessions isolated.** Each browser session only searches the resumes it uploaded, and stored vectors expire after 1 hour.

Frontend pages: Landing (`/`), Features (`/features`), About (`/about`), and the app itself (`/app`) with a 3-step flow: **Upload resumes → Add job description → Review ranking**. Light and dark themes are supported.

---

## 2. Architecture

```
                    HTTPS                         HTTP (server-to-server)
 ┌─────────┐   ┌──────────────┐  /api/* rewrite  ┌─────────────────────────────────────┐
 │ Browser │──▶│   Netlify    │─────────────────▶│  AWS EC2 (t3.small, Elastic IP)     │
 │ (React) │   │ static site  │                  │                                     │
 └─────────┘   │ + _redirects │                  │  PM2                                │
               └──────────────┘                  │  ├─ hire-help-node   Express :5000  │
                                                 │  └─ hire-help-python Flask   :8000  │
                                                 └───────┬───────────────┬─────────────┘
                                                         │               │
                                          ZIP upload     │               │ vectors + search
                                                         ▼               ▼
                                                   ┌──────────┐   ┌──────────────┐
                                                   │  AWS S3  │   │ Qdrant Cloud │
                                                   └──────────┘   └──────────────┘
                                                                        ▲
                                             Gemini 2.5 Flash  ◀────────┘ (JD de-buzzification,
                                             (called by Flask)              called by Flask)
```

**Two backend processes on one EC2 instance:**

| Process | Role | Port | Exposed publicly? |
|---|---|---|---|
| **Express (Node)** | Public API: receives uploads, stores ZIPs in S3, tracks jobs, calls Flask | 5000 | Yes |
| **Flask (Python)** | AI worker: text extraction, embeddings, Qdrant read/write | 8000 (`127.0.0.1` only) | No |

Node handles I/O and the web-facing work. Python handles the ML work (PyTorch, sentence-transformers, Gemini). Flask is deliberately not reachable from outside.

---

## 3. How it works (end-to-end flow)

### Step 1: Upload resumes (asynchronous job)

1. The browser sends `POST /api/upload` with `zipFile` and `sessionId` (multipart form).
2. Express saves the ZIP to `uploads/`, creates a `jobId`, marks the job `processing`, and **immediately returns `202`**.
3. In the background, Express (a) streams the ZIP to S3 under `zips/`, and (b) calls Flask `POST /process-zip`.
4. Flask extracts the ZIP to a per-job temp folder and reads each resume (PyMuPDF for PDF, python-docx for DOCX). Files that can't be read are skipped.
5. Flask encodes all resume texts with **BAAI/bge-small-en-v1.5** (384-dim, normalised vectors).
6. Each vector is upserted into the Qdrant collection `hire-help` with payload `{ file_name, session_id, expire_at = now + 3600s }`.
7. The browser polls `GET /api/job-status/:jobId` every 3 seconds until the status is `completed` or `failed`.

### Step 2: Add the job description (synchronous)

1. The browser sends `POST /api/upload-jd` with `document` (PDF/DOC/DOCX) and `sessionId`.
2. Express forwards the file path to Flask `POST /process-jd`.
3. Flask extracts the JD text, then **Gemini** appends a "Technical Keyword Expansion" section (falls back to the raw text if the API key is missing or the call fails).
4. Flask embeds the enriched JD and queries Qdrant with `session_id == <this session>`, returning the **top 10** by cosine similarity.
5. For each hit, Flask builds a 1-hour presigned S3 URL and returns `{ id, score, file_name, resume_url }`.

### Step 3: Review ranking

The frontend converts scores to percentages (0–1 becomes 0–100), de-duplicates by file name (keeping the best score), sorts them, and renders an animated table with colour-coded match bars: **≥ 75 Strong**, **≥ 50 Good**, otherwise **Partial**.

### Background cleanup

A janitor thread in Flask runs every 5 minutes and deletes Qdrant points whose `expire_at` has passed. This gives session data a 1-hour lifetime.

---

## 4. Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router 7, Tailwind CSS 3, axios, lucide-react |
| API server | Node.js (ESM), Express 5, Multer 2 (uploads), CORS, dotenv |
| AI service | Python 3, Flask, sentence-transformers (`BAAI/bge-small-en-v1.5`), PyTorch (CPU), PyMuPDF, python-docx |
| LLM | Google Gemini 2.5 Flash (`google-genai`), structured JSON output |
| Vector DB | Qdrant Cloud (cosine similarity, payload indexes on `session_id` and `expire_at`) |
| Object storage | AWS S3 (`@aws-sdk/client-s3`, `boto3` for presigned URLs) |
| Hosting | Netlify (frontend), AWS EC2 (backend), PM2 (process manager) |

---

## 5. Repository structure

```
HIRE-HELP/
├── netlify.toml                  # Netlify build config (base: frontend, publish: dist, Node 22)
├── frontend/
│   ├── public/_redirects         # /api/* proxy to EC2 + SPA fallback
│   ├── src/
│   │   ├── App.jsx               # Routes: / /features /about /app
│   │   ├── components/
│   │   │   ├── AppExperience.jsx # 3-step app UI, session id, ranked table
│   │   │   ├── UploadZip.jsx     # ZIP upload + job polling
│   │   │   ├── UploadJD.jsx      # JD upload + score normalisation
│   │   │   ├── LandingPage.jsx, FeaturesPage.jsx, About.jsx
│   │   │   └── Navbar, Footer, ThemeToggle, Reveal, MockRankingPreview …
│   │   └── context/ThemeContext.jsx
│   ├── vite.config.js            # '@' alias, React Compiler
│   └── .env                      # VITE_BACKEND_URL=/api
└── backend/
    ├── server.js                 # Express API (upload, upload-jd, job-status)
    ├── aws_s3.js                 # S3 client
    ├── package.json              # "start": python3 processor/server.py & node server.js
    ├── nixpacks.toml             # Build config for Nixpacks-style hosts
    └── processor/
        ├── server.py             # Flask: /process-zip, /process-jd, janitor loop
        ├── extract_text.py       # PDF / DOCX / text extraction
        ├── de_buzz.py            # Gemini JD keyword expansion
        ├── qdrant_upload.py      # Qdrant client, upsert, filtered search, presigned URLs
        ├── embeddings.py, processor.py, jd_processor.py, app.py   # earlier CLI/prototype code
        └── requirements.txt
```

---

## 6. API reference

Base URL in production: `https://hire-help.netlify.app/api` (proxied to `http://<EC2-IP>:5000`).

### `POST /upload`
Upload a ZIP of resumes.

- **Body** (`multipart/form-data`): `zipFile` (`.zip` only), `sessionId` (optional, defaults to `default-session`)
- **Response `202`**: `{ "success": true, "message": "...", "jobId": "1790481965510" }`
- **Errors**: `400` no file or not a ZIP

### `GET /job-status/:jobId`
Poll a processing job.

- **Response `200`**: `{ "success": true, "status": "processing|completed|failed", "s3Key": "zips/....zip", "data": {...}, "error": null }`
- **Errors**: `404` unknown job

### `POST /upload-jd`
Upload a job description and get the ranking.

- **Body** (`multipart/form-data`): `document` (`.pdf`, `.doc`, `.docx`), `sessionId`
- **Response `200`**: `{ "candidates": [ { "id", "score", "file_name", "resume_url" }, ... ] }` (top 10, score is cosine similarity 0–1)
- **Errors**: `400` no or unsupported file; `500` AI service error

### Flask (internal, `127.0.0.1:8000` only)
- `POST /process-zip` with `{ filePath, sessionId }`
- `POST /process-jd` with `{ filePath, sessionId }`

---

## 7. Environment variables

**`backend/.env`** (never commit this file; it is git-ignored)

| Variable | Purpose |
|---|---|
| `PORT` | Express port (default `5000`) |
| `AWS_REGION` | S3 region |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | S3 credentials |
| `AWS_BUCKET_NAME` | S3 bucket for ZIPs and resumes |
| `QDRANT_ENDPOINT`, `QDRANT_API_KEY` | Qdrant Cloud cluster |
| `GEMINI_API_KEY` | Gemini API for JD de-buzzification |

**`frontend/.env`**

| Variable | Value | Purpose |
|---|---|---|
| `VITE_BACKEND_URL` | `/api` | API base path. Keep it relative so the browser never calls `http://` directly |

> Vite bakes `VITE_*` values into the JavaScript bundle at build time, so changing one requires a rebuild. A value set in the Netlify dashboard overrides `.env`.

---

## 8. Run it locally

**Prerequisites:** Node 20.19+ (or 22), Python 3.11+, and accounts or keys for AWS S3, Qdrant Cloud and Gemini.

```bash
# 1. Backend: Node API
cd backend
npm install
cp .env.example .env        # fill in the variables from section 7 (or create .env by hand)

# 2. Backend: Python AI service (in a virtual environment)
python3 -m venv venv && source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r processor/requirements.txt

# 3. Start both (Flask on :8000, Express on :5000)
python3 processor/server.py &
node server.js

# 4. Frontend (new terminal)
cd frontend
npm install
```

For local development, point the frontend at the local backend by creating `frontend/.env.local`:

```
VITE_BACKEND_URL=http://localhost:5000
```

Then run `npm run dev` (Vite serves on `http://localhost:5173`).

> The first Flask start downloads the embedding model (about 130 MB) into `~/.cache/huggingface`.

---

## 9. Deployment

### Frontend: Netlify

Configured by `netlify.toml`:

| Setting | Value |
|---|---|
| Base directory | `frontend` |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node version | 22 |

`frontend/public/_redirects` does two jobs:

```
/api/*  http://<ELASTIC-IP>:5000/:splat  200     # proxy API calls to EC2 (rewrite, not redirect)
/*      /index.html                      200     # React Router: serve the SPA for every path
```

Netlify serves everything over HTTPS, and the `/api` rewrite lets the browser reach an HTTP-only backend without a mixed-content error.

### Backend: AWS EC2

**Recommended:** Ubuntu, **t3.small (2 GB RAM) or larger**, 16 GB disk, an **Elastic IP** attached, and a 2 GB swap file.

**Security group (inbound):** SSH 22 (your IP only), TCP 5000 (from anywhere, since Netlify's proxy IPs aren't fixed). **Do not open 8000**; Flask binds to `127.0.0.1`.

```bash
# One-time setup
git clone https://github.com/madanrajsagar/Hire-Help.git && cd Hire-Help/backend
npm install
python3 -m venv venv && source venv/bin/activate
pip install -r processor/requirements.txt
nano .env                       # add the variables from section 7

# Run both services under PM2
npm install -g pm2
pm2 start "venv/bin/python processor/server.py" --name hire-help-python
pm2 start server.js --name hire-help-node
pm2 save && pm2 startup         # run the command it prints, so services survive reboots

# Swap file (safety net for the ML model)
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Updating the server:**

```bash
cd ~/Hire-Help && git pull
pm2 restart all
pm2 logs --lines 30 --nostream
free -h && df -h /
```

> Make code changes on your own machine, push to GitHub, and only `git pull` on the server. Editing the server directly causes divergent-branch conflicts.

**Useful checks:**
```bash
curl -i http://<ELASTIC-IP>:5000/job-status/test    # 404 "Job not found" means Node is alive
pm2 list                                            # both apps online
sudo dmesg -T | grep -i -E "killed process|out of memory"    # OOM kills
```

---

## 10. Deployment issues we hit and how we fixed them

| # | Symptom | Root cause | Fix |
|---|---|---|---|
| 1 | Browser console: **"Mixed Content … requested an insecure XMLHttpRequest endpoint `http://…:5000/upload`"** | The site is HTTPS (Netlify) but called the HTTP backend directly; the `http://` URL was also baked into the bundle via `VITE_BACKEND_URL` | Frontend uses relative `/api`; Netlify `_redirects` rewrites `/api/*` to EC2 server-to-server; added `netlify.toml` |
| 2 | **"AI Processing Service Error: socket hang up"**; PM2 log shows `exited via signal [SIGKILL]`; later `ECONNREFUSED 127.0.0.1:8000` | Linux **OOM killer** stopped Flask: 908 MB RAM, no swap, PyTorch and the model used about 820 MB at idle | Upgraded to **t3.small**, added **2 GB swap**, reduced load (`batch_size` 32 → 8, `max_seq_length = 256`), per-job extract folder |
| 3 | Public IP would change after stop/start, breaking the hardcoded proxy target | Auto-assigned public IPs aren't permanent | Attached an **Elastic IP** and updated `_redirects` |
| 4 | Disk at **97%** of 6.6 GB | `venv` (1.6 GB), 2 GB swap file, model cache, accumulating uploads | Cleaned caches and old uploads; grew the EBS volume to 16 GB (`growpart` and `resize2fs`) |
| 5 | `git pull` → **"divergent branches"** | Server had its own commit while GitHub moved on | Backed up with a branch, `git reset --hard origin/main`; rule: never edit on the server |

Troubleshooting quick reference:

- `Mixed Content` in the console → the frontend is calling an `http://` URL; check `VITE_BACKEND_URL` and the Netlify environment variables.
- `socket hang up` or `ECONNREFUSED :8000` → Flask died; check `pm2 logs hire-help-python`, `free -h`, and `dmesg` for OOM.
- Netlify page loads but API calls fail → check the EC2 security group (port 5000), that the Elastic IP in `_redirects` is current, and `pm2 list`.
- Netlify proxy timeout (about 26 s) → very large ZIPs may fail to upload through the proxy (see limitations).

---

## 11. Design decisions

- **Semantic search over keyword matching.** Embeddings capture meaning (for example, "built REST services" is close to "API development"), which keyword filters miss.
- **`bge-small-en-v1.5` (384 dimensions).** Small and fast on CPU, with good retrieval quality. This kept the service runnable on a small EC2 instance without a GPU.
- **Asynchronous ZIP processing.** Embedding many resumes is slow, so `/upload` returns `202` with a `jobId` at once and the client polls. This avoids HTTP timeouts and keeps the UI responsive.
- **Separate Node and Python services.** Node is good at I/O and the web layer. Python owns the ML ecosystem. Flask listens only on localhost, so it is never exposed.
- **JD de-buzzification with Gemini.** Job descriptions are full of vague terms. Appending concrete technical definitions to the original text (not replacing it) improves the embedding, and the pipeline degrades gracefully to the raw text if the LLM call fails.
- **Session-scoped, expiring data.** A `session_id` payload filter (with a payload index) isolates users, and an `expire_at` timestamp plus a janitor loop deletes vectors after 1 hour. This limits stored personal data.
- **Netlify rewrite proxy.** Solves HTTPS-to-HTTP mixed content without buying a domain or certificate for the backend.
- **Presigned S3 URLs.** Resumes stay private in the bucket and are shared through short-lived links.

---

## 12. Security notes

- **Secrets:** `backend/.env` is git-ignored. Verify it was never committed (`git log --all -- backend/.env`); if it was, rotate the AWS, Qdrant and Gemini keys.
- **Network:** only ports 22 and 5000 are open; Flask (8000) is localhost-only. Restrict SSH to your own IP.
- **CORS:** currently `cors()` allows every origin. Restrict it to the Netlify domain for production.
- **Uploads:** file types are checked by extension only (`.zip`, `.pdf`, `.doc`, `.docx`). Add size limits and content checks (magic bytes) for a hardened deployment.
- **Data retention:** vectors expire after 1 hour, but uploaded ZIPs and JDs remain on the EC2 disk and in S3 until cleaned. Add a cleanup schedule or S3 lifecycle rule.
- **Zip extraction:** `ZipFile.extractall` should be hardened against path traversal ("zip slip") before accepting untrusted archives publicly.
- **IAM:** give the S3 credentials the minimum permissions (`PutObject` and `GetObject` on the one bucket).

---

## 13. Known limitations and roadmap

**Limitations (things to be aware of, or fix next):**

- **Job state is in memory** (`const jobs = {}` in `server.js`). It resets on restart and doesn't scale beyond one Node process. Use Redis or a database.
- **Netlify proxy timeout of about 26 s** can break very large ZIP uploads. Fix: HTTPS on the backend (domain plus Caddy or nginx with Let's Encrypt) so the browser uploads directly.
- **Presigned URL keys.** `generate_resume_url` links to `resumes/<file_name>` in S3, while Node uploads the ZIP itself to `zips/`. Verify that individual resumes exist under `resumes/`, or upload the extracted files there, otherwise the "View resume" links won't resolve.
- **Extraction is best effort.** Scanned or image-only PDFs yield no text (no OCR), and `.doc` (legacy Word) isn't reliably handled by `python-docx`.
- **Single-process Flask dev server** (`app.run`). Use gunicorn with one worker (the model is memory-heavy) for production.
- **Disk hygiene.** Uploaded files accumulate in `backend/uploads/`.
- **Housekeeping.** Tracked `.pyc` files, a stray `frontend/f/` copy, and prototype scripts (`processor.py`, `jd_processor.py`, `app.py`) can be removed.

**Roadmap ideas:**

- HTTPS and a custom domain for the backend
- Persistent job store (Redis/Postgres) and a proper queue (Celery/RQ/SQS)
- OCR for scanned resumes; richer parsing (skills, experience, education)
- Hybrid search (BM25 plus vectors) and a re-ranking step
- Explainable matches (highlight matched skills), exportable shortlists, team sharing
- CI/CD (GitHub Actions to EC2), health-check endpoint, monitoring and alerts
- Auth and per-user history

---

## Author

Built by [@madanrajsagar](https://github.com/madanrajsagar).
