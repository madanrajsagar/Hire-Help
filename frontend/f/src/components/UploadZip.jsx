import { useState, useRef } from 'react';
import axios from 'axios';

export function UploadZip({ sessionId }) {
  const [file, setFile] = useState(null);
  // Updated statuses: idle | uploading | processing | success | error
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const pollingIntervalRef = useRef(null);

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Helper function to poll the backend job status
  const startPolling = (jobId) => {
    // Clear any existing intervals just in case
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`https://hire-help-backend-production.up.railway.app/job-status/${jobId}`);
        const { status: jobStatus, data, error } = res.data;

        if (jobStatus === 'completed') {
          clearInterval(pollingIntervalRef.current);
          setStatus('success');
          console.log('Processing Complete! Python Data:', data);
        } else if (jobStatus === 'failed') {
          clearInterval(pollingIntervalRef.current);
          setStatus('error');
          setErrorMessage(error || 'Python processing failed.');
        }
        // If status is 'processing', it will just loop again in 3 seconds...
      } catch (err) {
        console.error('Polling error:', err);
        clearInterval(pollingIntervalRef.current);
        setStatus('error');
        setErrorMessage('Failed to fetch processing status.');
      }
    }, 3000); // Check every 3 seconds
  };

  const upload = async () => {
    if (!file || status === 'uploading' || status === 'processing') return;
    setStatus('uploading');
    setErrorMessage('');

    const formData = new FormData();
    formData.append('zipFile', file);
    formData.append('sessionId', sessionId);

    try {
      // 1. Send file to backend
      const res = await axios.post('https://hire-help-backend-production.up.railway.app/upload', formData);
      const { jobId } = res.data;

      // 2. File uploaded successfully! Switch UI state to processing
      setStatus('processing');

      // 3. Start checking back for Python results
      startPolling(jobId);

    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.response?.data?.message || 'Upload failed — try again');
    }
  };

  return (
    <div className="step-card">
      <span className="step-number">STEP 01</span>
      <h2 className="step-title">Load candidates</h2>
      <p className="step-desc">Upload a .zip archive containing the resumes you want to screen.</p>

      <label className={`scan-slot ${file ? 'has-file' : ''}`}>
        <input
          type="file"
          accept=".zip"
          disabled={status === 'uploading' || status === 'processing'}
          onChange={(e) => {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            setFile(e.target.files[0]);
            setStatus('idle');
            setErrorMessage('');
          }}
        />
        <span className="scan-slot-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 3v13m0 0-4-4m4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="scan-slot-text">
          <div className="scan-slot-filename">{file ? file.name : 'Choose a .zip file'}</div>
          <div className="scan-slot-hint">{file ? formatSize(file.size) : 'or drop it here'}</div>
        </span>
      </label>

      <div className="step-action">
        <button
          className="btn-primary"
          onClick={upload}
          disabled={!file || status === 'uploading' || status === 'processing'}
        >
          {status === 'uploading' && 'Uploading…'}
          {status === 'processing' && 'Processing…'}
          {status !== 'uploading' && status !== 'processing' && 'Upload resumes'}
        </button>

        {status === 'uploading' && (
          <span className="status-line pending"><span className="spinner" />Uploading archive...</span>
        )}
        {status === 'processing' && (
          <span className="status-line pending">
            <span className="spinner" />
            Generating vector embeddings instantly...
          </span>
        )}
        {status === 'success' && <span className="status-line success">Resumes loaded and processed successfully!</span>}
        {status === 'error' && (
          <span className="status-line error">{errorMessage || 'Upload failed — try again'}</span>
        )}
      </div>
    </div>
  );
}