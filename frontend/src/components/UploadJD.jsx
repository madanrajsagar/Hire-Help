import { useState, useEffect } from "react";
import axios from "axios";
import { FileText, Check, AlertCircle, X } from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "/api";

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function UploadJD({ sessionId, setCandidates, onStatusChange, resumesReady = true }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | uploading | success | error
  const [progress, setProgress] = useState(0); // Custom fake progress tracker %
  const [errorMessage, setErrorMessage] = useState("");
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (onStatusChange) onStatusChange(status);
  }, [status, onStatusChange]);

  // Fake matching progress simulation hook
  useEffect(() => {
    let interval;
    if (status === "uploading") {
      setProgress(10); // Start at 10% instantly
      interval = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress >= 92) {
            clearInterval(interval);
            return 92; // Hold right before 100% until API responds successfully
          }
          // Incrementally slow down as it gets closer to completion
          const increment = oldProgress > 60 ? 3 : 8;
          return oldProgress + increment;
        });
      }, 250);
    } else if (status === "success") {
      setProgress(100); // Complete the visual bar
    } else {
      setProgress(0);
    }

    return () => clearInterval(interval);
  }, [status]);

  const upload = async () => {
    if (!file || status === "uploading") return;
    setStatus("uploading");
    setErrorMessage("");
    const formData = new FormData();
    formData.append("document", file);
    formData.append("sessionId", sessionId);
    try {
      const res = await axios.post(`${BACKEND}/upload-jd`, formData);
      const cleanCandidates = (res.data.candidates || []).map((item) => {
        // Raw score is converted directly into a percentage value out of 100
        const rawScore = item.score || 0;
        const percentageScore = rawScore <= 1 ? rawScore * 100 : rawScore;

        return {
          file_name: item.file_name,
          score: Math.round(percentageScore), // Converts decimal points (e.g., 0.94) into 94
          resume_url: item.resume_url,
        };
      });
      setCandidates(cleanCandidates);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err.response?.data?.error || "Something went wrong while ranking — try again"
      );
    }
  };

  return (
    <div className="apple-card p-7 md:p-8 flex flex-col" data-testid="upload-jd-card">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-mono tracking-widest uppercase text-[#0071e3] dark:text-[#2997ff] px-2 py-0.5 rounded-full bg-[#0071e3]/10 dark:bg-[#2997ff]/15">
          Step 02
        </span>
        {status === "success" && (
          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#1f9d45] dark:text-[#34c759] animate-fade-in">
            <Check size={13} /> Done
          </span>
        )}
      </div>
      <h3 className="hl-headline text-[22px] text-neutral-900 dark:text-white">
        Define the role
      </h3>
      <p className="mt-1 text-[14px] text-neutral-500 dark:text-neutral-400">
        Upload the job description (PDF or DOCX, up to 10 MB) and we’ll rank your resumes against it.
      </p>

      <label
        className={`dropzone ${file ? "filled" : ""} ${dragging ? "dragging" : ""} mt-5 flex items-center gap-4 p-5 cursor-pointer relative`}
        data-testid="upload-jd-dropzone"
        onDragEnter={() => status !== "uploading" && setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDrop={() => setDragging(false)}
      >
        <input
          type="file"
          accept=".pdf,.docx"
          disabled={status === "uploading"}
          onChange={(e) => {
            const chosenFile = e.target.files[0];
            if (!chosenFile) return;

            const TEN_MB = 10 * 1024 * 1024;
            if (chosenFile.size > TEN_MB) {
              setFile(null);
              setStatus("error"); // Triggers the red error text below
              setErrorMessage("File exceeds the 10 MB limit.");
              return;
            }

            setFile(chosenFile);
            setStatus("idle");
            setErrorMessage("");
          }}
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          data-testid="upload-jd-input"
        />
        <div className="w-9 h-9 rounded-lg bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10 flex items-center justify-center text-[#0071e3] dark:text-[#2997ff] flex-shrink-0">
          <FileText size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-mono truncate text-neutral-800 dark:text-neutral-100">
            {file ? file.name : "Choose a .pdf or .docx file"}
          </div>
          <div className="text-[12px] text-neutral-500 mt-0.5">
            {file ? formatSize(file.size) : dragging ? "Release to add" : "or drag & drop it here"}
          </div>
        </div>
        {file && status !== "uploading" && (
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

      {!resumesReady && status !== "uploading" && (
        <p className="mt-3 text-[12px] text-amber-600 dark:text-amber-400 animate-fade-in">
          Tip: finish Step 01 first so there are resumes to rank against.
        </p>
      )}

      {/* Progress Bar Display Container */}
      {status === "uploading" && (
        <div className="mt-5 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between text-[12px] font-mono text-neutral-500">
            <span className="inline-flex items-center gap-2">
              <span className="spinner" /> Reading the job description &amp; scoring resumes…
            </span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bar-live h-full bg-[#0071e3] dark:bg-[#2997ff] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3 flex-wrap">
        <button
          className="btn-apple btn-primary-apple text-[14px] py-2.5 px-5"
          onClick={upload}
          disabled={!file || status === "uploading"}
          data-testid="upload-jd-submit"
        >
          {status === "uploading" ? "Matching…" : "Rank candidates"}
        </button>

        {status === "success" && (
          <span
            className="text-[12px] font-mono text-[#34c759] inline-flex items-center gap-1.5"
            data-testid="upload-jd-status-success"
          >
            <Check size={13} className="pop-in" /> Ranking ready — see results below
          </span>
        )}
        {status === "error" && (
          <span
            className="text-[12px] font-mono text-[#ff453a] inline-flex items-center gap-1.5"
            data-testid="upload-jd-status-error"
          >
            <AlertCircle size={13} /> {errorMessage || "Upload failed — try again"}
          </span>
        )}
      </div>
    </div>
  );
}