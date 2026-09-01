import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import useAuth from "../hooks/useAuth";
import "../../../style/home.scss";

const MAX_JD_CHARS = 5000;
const MAX_FILE_MB = 5;
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

function Home() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  // ── Form state ──
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fileInputRef = useRef(null);

  // ── Auth guard ──
  if (!authLoading && !isAuthenticated) {
    navigate("/login");
    return null;
  }

  // ── File helpers ──
  const validateFile = (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Only PDF, DOCX, and TXT files are supported.");
      return false;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_FILE_MB}MB.`);
      return false;
    }
    return true;
  };

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      setResumeFile(file);
      setError("");
    }
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setResumeFile(file);
      setError("");
    }
  };

  const removeFile = () => {
    setResumeFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fileIcon = (type) => {
    if (type === "application/pdf") return "📕";
    if (type?.includes("wordprocessingml")) return "📘";
    return "📄";
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!jobDescription.trim()) {
      setError("Please paste the job description.");
      return;
    }
    if (!resumeFile && !selfDescription.trim()) {
      setError("Please upload a resume or provide a self-description.");
      return;
    }

    setSubmitting(true);
    try {
      let resumeText = "";
      if (resumeFile) {
        resumeText = await resumeFile.text();
      }

      const res = await fetch("/api/ai/interview-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          resumeText: resumeText || selfDescription.trim(),
          jobDescription: jobDescription.trim(),
          selfDescription: selfDescription.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Analysis failed.");

      setSuccess("Analysis complete! Your interview strategy is ready.");
      setResumeFile(null);
      setJobDescription("");
      setSelfDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Logout ──
  const handleLogout = async () => {
    try { await logout(); } catch { /* silent */ }
    navigate("/login");
  };

  // ── Auth loading ──
  if (authLoading) {
    return (
      <div className="home-page">
        <div className="home-loading">
          <div className="loading-ring" />
          <p className="loading-msg">Verifying session…</p>
        </div>
      </div>
    );
  }

  const canSubmit =
    jobDescription.trim() &&
    (resumeFile || selfDescription.trim()) &&
    !submitting;

  return (
    <div className="home-page">
      {/* ── Hero ── */}
      <section className="home-hero">
        <h1 className="hero-title">
          Create Your Custom{" "}
          <span className="gradient-text">Interview Plan</span>
        </h1>
        <p className="hero-subtitle">
          Let our AI analyze the job requirements and your unique profile to
          build a winning strategy.
        </p>
        <span className="hero-dot" />
      </section>

      {/* ── Status Messages ── */}
      {error && (
        <div className="home-error">
          <span>⚠️</span> {error}
        </div>
      )}
      {success && (
        <div className="home-success">
          <span>✅</span> {success}
        </div>
      )}

      {submitting ? (
        <div className="home-loading">
          <div className="loading-ring" />
          <p className="loading-msg">Generating your interview strategy…</p>
          <p className="loading-sub">This may take 15–30 seconds</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* ── Two-Column Grid ── */}
          <div className="home-form-grid">
            {/* ── Left: Job Description ── */}
            <div className="form-card">
              <div className="card-header">
                <span className="card-title">
                  <span className="card-icon">🎯</span> Target Job Description
                </span>
                <span className="badge badge-required">Required</span>
              </div>
              <textarea
                className="jd-textarea"
                placeholder={`Paste the full job description here...\ne.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'`}
                value={jobDescription}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_JD_CHARS) {
                    setJobDescription(e.target.value);
                  }
                }}
                maxLength={MAX_JD_CHARS}
              />
              <p className="char-counter">
                {jobDescription.length} / {MAX_JD_CHARS} chars
              </p>
            </div>

            {/* ── Right: Your Profile ── */}
            <div className="form-card">
              <div className="card-header">
                <span className="card-title">
                  <span className="card-icon">👤</span> Your Profile
                </span>
              </div>

              {/* Upload Resume */}
              <div style={{ marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>Upload Resume</span>
                  <span className="badge badge-best">Best Results!</span>
                </div>

                {!resumeFile ? (
                  <div
                    className={`upload-zone ${dragOver ? "drag-active" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleFileDrop}
                  >
                    <div className="upload-icon-circle">
                      <span className="upload-svg">☁️</span>
                    </div>
                    <p className="upload-label">Click to upload or drag & drop</p>
                    <p className="upload-hint">PDF or DOCX (Max 5MB)</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileSelect}
                    />
                  </div>
                ) : (
                  <div className="file-attached">
                    <span className="file-emoji">{fileIcon(resumeFile.type)}</span>
                    <div className="file-meta">
                      <p className="file-name">{resumeFile.name}</p>
                      <p className="file-size">{formatSize(resumeFile.size)}</p>
                    </div>
                    <button type="button" className="file-remove" onClick={removeFile} title="Remove">
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* OR Divider */}
              <div className="or-divider">
                <span>or</span>
              </div>

              {/* Self Description */}
              <p className="self-desc-label">Quick Self-Description</p>
              <textarea
                className="self-desc-textarea"
                placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                value={selfDescription}
                onChange={(e) => setSelfDescription(e.target.value)}
                rows={4}
              />

              {/* Info Banner */}
              <div className="info-banner">
                <span className="info-dot" />
                <span>
                  Either a <strong>Resume</strong> or a{" "}
                  <strong>Self Description</strong> is required to generate a
                  personalized plan.
                </span>
              </div>
            </div>
          </div>

          {/* ── Bottom Bar ── */}
          <div className="home-bottom-bar">
            <span className="bottom-info">
              AI-Powered Strategy Generation <span className="dot-separator">•</span> Approx 30s
            </span>
            <button type="submit" className="generate-btn" disabled={!canSubmit}>
              <span className="btn-sparkle">✨</span>
              Generate My Interview Strategy
            </button>
          </div>
        </form>
      )}

      {/* ── Footer ── */}
      <footer className="home-footer">
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Help Center</a>
        </div>
      </footer>
    </div>
  );
}

export default Home;