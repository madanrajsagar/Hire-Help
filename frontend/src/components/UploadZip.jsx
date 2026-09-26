import { useRef, useState, useEffect } from "react";
import axios from "axios";
import { Upload, Check, AlertCircle, X, Archive } from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://3.109.54.35:5000";

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function UploadZip({ sessionId, onStatusChange }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | uploading | processing | success | error
  const [errorMessage, setErrorMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    if (onStatusChange) onStatusChange(status);
  }, [status, onStatusChange]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const startPolling = (jobId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`${BACKEND}/job-status/${jobId}`);
        const { status: jobStatus, error } = res.data;
        if (jobStatus === "completed") {
          clearInterval(pollRef.current);
          setStatus("success");
        } else if (jobStatus === "failed") {
          clearInterval(pollRef.current);
          setStatus("error");
          setErrorMessage(error || "Python processing failed.");
        }
      } catch (err) {
        clearInterval(pollRef.current);
        setStatus("error");
        setErrorMessage("Failed to fetch processing status.");
      }
    }, 3000);
  };

  const upload = async () => {
    if (!file || status === "uploading" || status === "processing") return;
    setStatus("uploading");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("zipFile", file);
    formData.append("sessionId", sessionId);

    try {
      const res = await axios.post(`${BACKEND}/upload`, formData);
      const { jobId } = res.data;
      setStatus("processing");
      startPolling(jobId);
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err.response?.data?.message || "Upload failed — try again"
      );
    }
  };

  const busy = status === "uploading" || status === "processing";

  return (
    <div className="apple-card p-7 md:p-8 flex flex-col" data-testid="upload-zip-card">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-mono tracking-widest uppercase text-[#0071e3] dark:text-[#2997ff] px-2 py-0.5 rounded-full bg-[#0071e3]/10 dark:bg-[#2997ff]/15">
          Step 01
        </span>
        {status === "success" && (
          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#1f9d45] dark:text-[#34c759] animate-fade-in">
            <Check size={13} /> Done
          </span>
        )}
      </div>
      <h3 className="hl-headline text-[22px] text-neutral-900 dark:text-white">
        Load candidates
      </h3>
      <p className="mt-1 text-[14px] text-neutral-500 dark:text-neutral-400">
        Upload a .zip archive of resumes (PDF or DOCX, up to 100 MB). We read and index each one.
      </p>

      <label
        className={`dropzone ${file ? "filled" : ""} ${dragging ? "dragging" : ""} mt-5 flex items-center gap-4 p-5 cursor-pointer relative`}
        data-testid="upload-zip-dropzone"
        onDragEnter={() => !busy && setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDrop={() => setDragging(false)}
      >
        <input
          type="file"
          accept=".zip"
          disabled={busy}
          onChange={(e) => {
            const chosenFile = e.target.files[0];
            if (!chosenFile) return;

            const ONE_HUNDRED_MB = 100 * 1024 * 1024;
            if (chosenFile.size > ONE_HUNDRED_MB) {
              setFile(null);
              setStatus("error");
              setErrorMessage("ZIP file exceeds the 100MB size limit.");
              return;
            }

            if (pollRef.current) clearInterval(pollRef.current);

            // Use the safe variable reference instead of re-reading e.target.files
            setFile(chosenFile);
            setStatus("idle");
            setErrorMessage("");
          }}
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          data-testid="upload-zip-input"
        />
        <div className="w-9 h-9 rounded-lg bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10 flex items-center justify-center text-[#0071e3] dark:text-[#2997ff] flex-shrink-0">
          {file ? <Archive size={16} /> : <Upload size={16} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-mono truncate text-neutral-800 dark:text-neutral-100">
            {file ? file.name : "Choose a .zip file"}
          </div>
          <div className="text-[12px] text-neutral-500 mt-0.5">
            {file ? formatSize(file.size) : dragging ? "Release to add" : "or drag & drop it here"}
          </div>
        </div>
        {file && !busy && (
          <button
            type="button"
            aria-label="Remove file"
            title="Remove file"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setFile(null);
              setStatus("idle");
              setErrorMessage("");
            }}
            className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-black/5 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </label>

      <div className="mt-6 flex items-center gap-3 flex-wrap">
        <button
          className="btn-apple btn-primary-apple text-[14px] py-2.5 px-5"
          onClick={upload}
          disabled={!file || busy}
          data-testid="upload-zip-submit"
        >
          {status === "uploading" && "Uploading…"}
          {status === "processing" && "Processing…"}
          {!busy && (status === "success" ? "Upload different resumes" : "Upload resumes")}
        </button>

        {status === "uploading" && (
          <span className="text-[12px] font-mono text-neutral-500 inline-flex items-center gap-2">
            <span className="spinner" /> Uploading archive…
          </span>
        )}
        {status === "processing" && (
          <span
            className="text-[12px] font-mono text-neutral-500 inline-flex items-center gap-2"
            data-testid="upload-zip-status-processing"
          >
            <span className="spinner" /> Reading &amp; indexing resumes — this can take a minute…
          </span>
        )}
        {status === "success" && (
          <span
            className="text-[12px] font-mono text-[#34c759] inline-flex items-center gap-1.5"
            data-testid="upload-zip-status-success"
          >
            <Check size={13} className="pop-in" /> Resumes indexed — now add a job description
          </span>
        )}
        {status === "error" && (
          <span className="text-[12px] font-mono text-[#ff453a] inline-flex items-center gap-1.5">
            <AlertCircle size={13} />
            {errorMessage || "Upload failed — try again"}
          </span>
        )}
      </div>
    </div>
  );
}