import { useEffect } from "react";
import { useNavigate } from "react-router";
import useAuth from "../hooks/useAuth";
import "../auth.form.scss";

function Dashboard() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // If the session check is done and the user isn't authenticated, redirect
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [loading, isAuthenticated, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-container" style={{ alignItems: "center", justifyContent: "center" }}>
          <div className="spinner"></div>
          <p style={{ marginTop: "16px", color: "#888" }}>Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // useEffect above will redirect
  }

  return (
    <div className="auth-page dashboard-page">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="logo-container">
            <span className="logo-icon">📄</span>
            <h2 className="logo-text">CV Analyzer</h2>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </header>

        <main className="dashboard-main">
          <section className="welcome-card">
            <h1>Welcome back, <span className="highlight">{user?.username}</span>!</h1>
            <p className="subtitle">Account associated with: <strong>{user?.email}</strong></p>
          </section>

          <section className="analyzer-placeholder">
            <div className="upload-box">
              <div className="upload-icon">📤</div>
              <h3>Analyze Your Resume</h3>
              <p>Drag & drop your resume (PDF, DOCX) here, or browse files</p>
              <button className="upload-btn">Upload Resume</button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;

