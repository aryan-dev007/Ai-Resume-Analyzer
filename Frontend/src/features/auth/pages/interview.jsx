import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import '../../../style/interview.scss';

const Interview = () => {
  const { interviewId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('technical'); // 'technical' | 'behavioral' | 'roadmap'
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const res = await fetch(`/api/interview/report/${interviewId}/pdf`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to generate PDF resume');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanTitle = report?.jobTitle ? report.jobTitle.replace(/[^a-zA-Z0-9]/g, '_') : 'Tailored';
      a.download = `Tailored_Resume_${cleanTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error downloading PDF: ' + err.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/interview/report/${interviewId}`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load report');
        setReport(data.report);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) {
      fetchReport();
    }
  }, [interviewId]);

  if (loading) {
    return (
      <div className="interview-page-container">
        <div className="interview-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <p>Loading your customized interview strategy...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="interview-page-container">
        <div className="interview-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#ef4444' }}>
          <p>Error: {error || 'Report not found'}</p>
        </div>
      </div>
    );
  }

  const technicalQuestions = report.technicalQuestions || [];
  const behavioralQuestions = report.behavioralQuestions || [];
  const preparationPlan = report.preparationPlan || [];
  const skillGaps = report.skillGaps || [];

  const toggleExpand = (idx) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="interview-page-container">
      <div className="interview-card">
        {/* Left Column - Navigation */}
        <div className="interview-sidebar">
          <div className="sidebar-title">Strategy Menu</div>
          <ul className="nav-list">
            <li
              className={`nav-item ${activeTab === 'technical' ? 'active' : ''}`}
              onClick={() => { setActiveTab('technical'); setExpandedIndex(null); }}
            >
              <span className="cursor-icon">⚡</span>
              Technical questions
            </li>
            <li
              className={`nav-item ${activeTab === 'behavioral' ? 'active' : ''}`}
              onClick={() => { setActiveTab('behavioral'); setExpandedIndex(null); }}
            >
              <span className="cursor-icon">⚡</span>
              Behavioral questions
            </li>
            <li
              className={`nav-item ${activeTab === 'roadmap' ? 'active' : ''}`}
              onClick={() => { setActiveTab('roadmap'); setExpandedIndex(null); }}
            >
              <span className="cursor-icon">⚡</span>
              Road Map
            </li>
          </ul>
          
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #e91e73, #ff4081)',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: downloadingPdf ? 'not-allowed' : 'pointer',
                opacity: downloadingPdf ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(233, 30, 115, 0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              {downloadingPdf ? '⏳ Generating PDF...' : '✨ Download Resume PDF'}
            </button>
          </div>
        </div>

        {/* Middle Column - Main Content */}
        <div className="interview-main-content">
          {report.summary && (
            <div style={{
              backgroundColor: '#161621',
              borderRadius: '14px',
              padding: '1.2rem 1.5rem',
              border: '1px solid rgba(233, 30, 115, 0.25)',
              background: 'linear-gradient(135deg, rgba(233, 30, 115, 0.05), rgba(22, 22, 33, 0.9))',
              marginBottom: '1.8rem'
            }}>
              <h3 style={{ fontSize: '0.95rem', color: '#e91e73', margin: '0 0 0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}>
                ✨ Candidate Fit Assessment
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#9e9eb3', margin: 0, lineHeight: '1.6' }}>
                {report.summary}
              </p>
            </div>
          )}

          {activeTab === 'technical' && (
            <div className="questions-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#ffffff', fontWeight: '700' }}>Technical Questions</h2>
              {technicalQuestions.map((q, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#161621',
                    padding: '1.4rem',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => toggleExpand(idx)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', backgroundColor: 'rgba(255, 255, 255, 0.06)', color: '#9e9eb3' }}>
                      {q.topic || 'General'} • {q.difficulty || 'medium'}
                    </span>
                    <span style={{ color: '#e91e73', fontSize: '0.8rem', fontWeight: '600' }}>{expandedIndex === idx ? '▲ Collapse' : '▼ Show Answer'}</span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', color: '#ffffff', margin: '0.4rem 0', fontWeight: '600' }}>{q.question}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#5e5e73', fontStyle: 'italic', margin: '0.3rem 0 0.8rem 0' }}>
                    Intent: {q.intention}
                  </p>

                  {expandedIndex === idx && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', color: '#9e9eb3', fontSize: '0.92rem', lineHeight: '1.6' }}>
                      <strong style={{ color: '#ffffff' }}>Suggested Approach / Answer:</strong>
                      <p style={{ marginTop: '0.4rem', whiteSpace: 'pre-line' }}>{q.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'behavioral' && (
            <div className="questions-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#ffffff', fontWeight: '700' }}>Behavioral Questions (STAR Method)</h2>
              {behavioralQuestions.map((q, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#161621',
                    padding: '1.4rem',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => toggleExpand(idx)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', backgroundColor: 'rgba(255, 255, 255, 0.06)', color: '#9e9eb3' }}>
                      {q.topic || 'Behavioral'}
                    </span>
                    <span style={{ color: '#e91e73', fontSize: '0.8rem', fontWeight: '600' }}>{expandedIndex === idx ? '▲ Collapse' : '▼ Sample Answer'}</span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', color: '#ffffff', margin: '0.4rem 0', fontWeight: '600' }}>{q.question}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#5e5e73', fontStyle: 'italic', margin: '0.3rem 0 0.8rem 0' }}>
                    Trait Evaluated: {q.intention}
                  </p>

                  {expandedIndex === idx && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', color: '#9e9eb3', fontSize: '0.92rem', lineHeight: '1.6' }}>
                      <strong style={{ color: '#ffffff' }}>STAR Sample Response:</strong>
                      <p style={{ marginTop: '0.4rem', whiteSpace: 'pre-line' }}>{q.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'roadmap' && (
            <div className="roadmap-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#ffffff', fontWeight: '700' }}>Preparation Roadmap</h2>
              {preparationPlan.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#161621',
                    padding: '1.4rem',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#ffffff', background: 'linear-gradient(135deg, #e91e73, #ff6ec7)', padding: '3px 12px', borderRadius: '20px' }}>
                      {step.day || `Step ${idx + 1}`}
                    </span>
                    <span style={{ color: '#5e5e73', fontSize: '0.8rem' }}>⏱ {step.estimatedHours || 2}h estimated</span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', color: '#ffffff', margin: '0.4rem 0', fontWeight: '600' }}>{step.topic}</h3>

                  {step.tasks && step.tasks.length > 0 && (
                    <ul style={{ paddingLeft: '1.2rem', color: '#9e9eb3', fontSize: '0.9rem', margin: '0.6rem 0 0 0', lineHeight: '1.6' }}>
                      {step.tasks.map((task, tIdx) => (
                        <li key={tIdx} style={{ marginBottom: '0.3rem' }}>{task}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Match Score & Skill Gaps */}
        <div className="interview-right-panel">
          {/* Match Score Card */}
          <div style={{
            backgroundColor: '#161621',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid rgba(233, 30, 115, 0.25)',
            textAlign: 'center',
            marginBottom: '2rem',
            boxShadow: '0 8px 30px rgba(233, 30, 115, 0.08)'
          }}>
            <h3 style={{ fontSize: '0.8rem', color: '#5e5e73', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 1rem 0', fontWeight: '700' }}>
              Resume Match Score
            </h3>
            <div style={{
              position: 'relative',
              width: '96px',
              height: '96px',
              margin: '0 auto 1rem auto',
              borderRadius: '50%',
              background: `conic-gradient(#e91e73 ${report.matchScore || 0}%, #1a1a26 0)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(233, 30, 115, 0.3)'
            }}>
              <div style={{
                width: '78px',
                height: '78px',
                borderRadius: '50%',
                backgroundColor: '#111118',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}>
                <span style={{ fontSize: '1.7rem', fontWeight: '800', color: '#ffffff' }}>
                  {report.matchScore || 0}%
                </span>
              </div>
            </div>
            {report.jobTitle && (
              <p style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: '700', margin: '0.4rem 0 0.2rem 0' }}>
                {report.jobTitle}
              </p>
            )}
            {report.company && report.company !== 'Unknown' && (
              <p style={{ fontSize: '0.8rem', color: '#9e9eb3', margin: 0 }}>
                {report.company}
              </p>
            )}
          </div>

          {/* Skill Gaps */}
          <h3 className="panel-heading">Skill Gaps</h3>
          <div className="skill-tags" style={{ marginBottom: '2rem' }}>
            {skillGaps.length > 0 ? (
              skillGaps.map((sg, idx) => (
                <span key={idx} className="skill-pill" title={sg.recommendation || ''}>
                  {typeof sg === 'string' ? sg : sg.skill}
                </span>
              ))
            ) : (
              <span className="skill-pill">No major gaps found!</span>
            )}
          </div>

          {/* Keywords Matched */}
          {report.keywordsMatched && report.keywordsMatched.length > 0 && (
            <>
              <h3 className="panel-heading" style={{ color: '#22c55e' }}>Matched Keywords</h3>
              <div className="skill-tags" style={{ marginBottom: '2rem' }}>
                {report.keywordsMatched.map((kw, idx) => (
                  <span key={idx} className="skill-pill" style={{ borderColor: '#22c55e', color: '#4ade80' }}>
                    ✓ {kw}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Keywords Missing */}
          {report.keywordsMissing && report.keywordsMissing.length > 0 && (
            <>
              <h3 className="panel-heading" style={{ color: '#ef4444' }}>Missing Keywords</h3>
              <div className="skill-tags">
                {report.keywordsMissing.map((kw, idx) => (
                  <span key={idx} className="skill-pill" style={{ borderColor: '#ef4444', color: '#f87171' }}>
                    ✗ {kw}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Interview;

