import { useState } from 'react';
import axios from 'axios';

export function UploadJD({ sessionId, setCandidates }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const upload = async () => {
    if (!file || status === 'uploading') return;
    setStatus('uploading');
    const formData = new FormData();
    formData.append('document', file);
    formData.append('sessionId', sessionId);
    try {
      const res = await axios.post('https://hire-help-backend-production.up.railway.app/upload-jd', formData);
      console.log(res.data);

    const cleanCandidates = res.data.candidates.map(item => ({
      file_name: item.file_name,
      score: item.score || 0,
      resume_url: item.resume_url // Set up your bucket file URL structures here if needed
    }));

    setCandidates(cleanCandidates); // Pass the flattened structure to App state
    setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="step-card">
      <span className="step-number">STEP 02</span>
      <h2 className="step-title">Define the role</h2>
      <p className="step-desc">Upload the job description to rank candidates against.</p>

      <label className={`scan-slot ${file ? 'has-file' : ''}`}>
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={(e) => {
            setFile(e.target.files[0]);
            setStatus('idle');
          }}
        />
        <span className="scan-slot-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 3v5h5M9 13h6M9 17h6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="scan-slot-text">
          <div className="scan-slot-filename">{file ? file.name : 'Choose a .pdf or .docx file'}</div>
          <div className="scan-slot-hint">{file ? formatSize(file.size) : 'or drop it here'}</div>
        </span>
      </label>

      <div className="step-action">
        <button className="btn-primary" onClick={upload} disabled={!file || status === 'uploading'}>
          {status === 'uploading' ? 'Matching…' : 'Rank candidates'}
        </button>
        {status === 'uploading' && (
          <span className="status-line pending"><span className="spinner" />Scoring resumes</span>
        )}
        {status === 'success' && <span className="status-line success">Ranking ready</span>}
        {status === 'error' && <span className="status-line error">Upload failed — try again</span>}
      </div>
    </div>
  );
}