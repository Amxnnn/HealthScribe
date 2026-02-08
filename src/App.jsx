import React, { useState, useEffect } from 'react';
import { Mic, Send, Menu, Activity as LogoIcon, Play, RefreshCw, Sparkles, Loader2, FileDown, Sun, Moon, X } from 'lucide-react';
import { TamboProvider, useTambo } from '@tambo-ai/react';
import { tamboConfig } from './config/tamboConfig';
import { PatientProvider } from './context/PatientContext.jsx';
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx';

// Phase 4 Imports
import SpecialtySelector from './components/SpecialtySelector';
import StatsBar from './components/StatsBar';
import VoiceInput from './components/VoiceInput';
import AlertSystem from './components/AlertSystem';
import TemplateLibrary from './components/TemplateLibrary';
import { generateMedicalPDF } from './utils/pdfExport';
import { parseMedicalNotes } from './utils/medicalParser';

// Helper to safely extract text from message content
const extractTextFromMessage = (content) => {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map(part => part.text || '').join('');
  }
  if (typeof content === 'object' && content.text) return content.text;
  return JSON.stringify(content);
};

// Markdown Renderer Component
const FormattedMessage = ({ content }) => {
  const text = extractTextFromMessage(content);

  // Split by newlines first
  const sections = text.split('\n');

  return (
    <div style={{ lineHeight: '1.6' }}>
      {sections.map((section, i) => {
        if (!section) return <br key={i} />;

        // Simple parser for **bold** text
        const parts = section.split(/(\*\*.*?\*\*)/g);

        return (
          <p key={i} style={{ minHeight: '1rem', margin: '0 0 0.25rem 0' }}>
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j}>{part.slice(2, -2)}</strong>;
              }
              return <span key={j}>{part}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
};

// Theme Toggle Component
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="btn"
      style={{
        width: '32px',
        height: '32px',
        padding: 0,
        borderRadius: '50%',
        backgroundColor: 'var(--bg-tertiary)',
        border: '1px solid var(--border-medium)',
        color: 'var(--text-secondary)'
      }}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
};

function AppContent() {
  // ... (state)
  const [noteInput, setNoteInput] = useState('');
  const [specialty, setSpecialty] = useState('general');
  const [stats, setStats] = useState({ componentCount: 0, aiCalls: 0 });
  const [alerts, setAlerts] = useState([]);
  const [extractedData, setExtractedData] = useState({}); // For PDF/Alerts
  const [isSending, setIsSending] = useState(false); // Local loading state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile Sidebar State

  // Use Tambo Hook
  const tambo = useTambo({
    systemPrompt: `You are a medical documentation assistant specialized in ${specialty} medicine. 
    
    CRITICAL GUARDRAILS:
    1. You are STRICTLY a medical assistant. You MUST REFUSE to answer any questions unrelated to medicine, health, biology, or clinical documentation.
    2. If asked about general knowledge (e.g., "who is the president", "math questions", "coding", "movies"), politely decline and state that you can only assist with medical documentation.
    3. Example Refusal: "I am designed solely for medical documentation. Please provide clinical notes or patient details."

    CRITICAL INSTRUCTION: You MUST use the provided UI components to render medical output.
    However, if you are refusing a non-medical query, you MAY output plain text to explain the refusal.
    
    - If the user provides patient info, use 'PatientCard'.
    - If the user provides vitals, use 'VitalSigns'.
    - If the user provides clinical notes, use 'SoapNotes'.
    - If the user provides meds, use 'PrescriptionForm'.
    - If the user provides labs, use 'LabOrderForm'.

    NEW CAPABILITY: 'ClinicalInsights'
    - ALWAYS generate this component when you identify actionable medical data.
    - SUGGESTIONS: Proactively recommend referrals, follow-ups, or tests based on abnormal vitals or symptoms.
    - SAFETY: Check for drug interactions (e.g. Warfarin + Aspirin) or contraindications.
    - CODING: Automatically append valid ICD-10 codes for diagnoses and RxNorm codes for meds.

    Analyze doctor's notes and select appropriate UI components to build comprehensive medical documentation. Extract structured data accurately from natural language. Maintain context across inputs.`
  });

  // Extract CORRECT API values
  const { currentThread, sendThreadMessage, streaming = false, isIdle = true, reset } = tambo || {};

  // Derived State
  const messages = currentThread?.messages || [];
  const components = messages
    .filter(m => m.renderedComponent)
    .map(m => m.renderedComponent);

  const isProcessing = isSending || streaming;

  // Track Stats
  useEffect(() => {
    if (components.length && components.length !== stats.componentCount) {
      setStats(prev => ({
        ...prev,
        componentCount: components.length
      }));
    }
  }, [components.length]);

  // Hybrid Logic: Use local parser for Alerts & PDF data, let AI handle UI
  const messageLength = messages.length;
  useEffect(() => {
    if (messageLength === 0) return;

    // Combine all user messages to analyze current context
    const fullContext = messages
      .filter(m => m.role === 'user')
      .map(m => extractTextFromMessage(m.content))
      .join(' ');

    if (fullContext) {
      const parsed = parseMedicalNotes(fullContext);
      setExtractedData(parsed);

      // Generating Alerts locally
      const newAlerts = [];
      if (parsed.vitals) {
        if (parsed.vitals.bp) {
          const [sys, dia] = parsed.vitals.bp.split('/').map(Number);
          if (sys >= 160 || dia >= 100) newAlerts.push({ severity: 'critical', title: 'Hypertension Warning', message: `BP ${parsed.vitals.bp} is significantly elevated.` });
        }
        if (parsed.vitals.temp && parseFloat(parsed.vitals.temp) > 102) {
          newAlerts.push({ severity: 'warning', title: 'High Fever', message: `Detailed fever workup recommended.` });
        }
        if (parsed.vitals.o2Sat && parseInt(parsed.vitals.o2Sat) < 92) {
          newAlerts.push({ severity: 'critical', title: 'Hypoxia Alert', message: 'Consider immediate O2 therapy.' });
        }
      }
      // Drug Interactions (Mock)
      if (parsed.prescription && parsed.prescription.medication) {
        const meds = parsed.prescription.medication.toLowerCase();
        if (meds.includes('warfarin') && meds.includes('aspirin')) {
          newAlerts.push({ severity: 'critical', title: 'Interaction Alert', message: 'Warfarin + Aspirin increases bleeding risk.' });
        }
      }
      setAlerts(newAlerts);
    }
  }, [messageLength]);

  const handleProcessNotes = async (text = noteInput) => {
    if (!text.trim()) return;
    setNoteInput(''); // Clear immediately for UX
    setIsSending(true);
    setStats(p => ({ ...p, aiCalls: p.aiCalls + 1 }));

    if (typeof sendThreadMessage === 'function') {
      try {
        await sendThreadMessage(text);
      } catch (e) {
        console.error("Tambo SDK sendThreadMessage failed:", e);
        alert("Error sending message to AI. Check console.");
      } finally {
        setIsSending(false); // Ensure loading state is reset
      }
    } else {
      console.error("Tambo SDK Error: sendThreadMessage is not a function.", Object.keys(tambo || {}));
      alert("AI Connection Error: SDK API Mismatch.");
      setIsSending(false);
    }
  };

  const handleReset = () => {
    if (tambo?.startNewThread) {
      tambo.startNewThread();
    } else if (reset) {
      reset();
    }

    setNoteInput('');
    setAlerts([]);
    setExtractedData({});
    setStats({ componentCount: 0, aiCalls: 0 });
    setIsSending(false);
    setIsSidebarOpen(false); // Close sidebar on reset
  };

  const handleExportPDF = () => {
    generateMedicalPDF(extractedData);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleProcessNotes();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handleReset();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handleExportPDF();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [noteInput, tambo]);

  return (
    <PatientProvider data={extractedData}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Header */}
        <header style={{
          height: '60px',
          borderBottom: '1px solid var(--border-light)',
          backgroundColor: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1.5rem',
          justifyContent: 'space-between',
          flexShrink: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Mobile Menu Button */}
            <button
              className="btn mobile-only"
              style={{ padding: '0.25rem', display: 'none' }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <LogoIcon size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                HealthScribe
                <span style={{ fontSize: '0.6em', background: 'var(--bg-tertiary)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: '500', color: 'var(--text-secondary)' }}>PRO</span>
              </h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <StatsBar stats={stats} />
            <ThemeToggle />
            <button onClick={handleExportPDF} className="btn" style={{ fontSize: '0.8rem', gap: '0.25rem', border: '1px solid var(--border-medium)' }}>
              <FileDown size={14} /> Export PDF
            </button>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-medium)' }}></div>
          </div>
        </header>

        {/* Main Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

          {/* Left Sidebar - Chat/Input */}
          <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`} style={{
            width: '400px',
            borderRight: '1px solid var(--border-light)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            transition: 'transform 0.3s ease',
            // Mobile styles handled by CSS class or inline logic if complex
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-primary)' }}>
              <SpecialtySelector onSpecialtyChange={setSpecialty} currentSpecialty={specialty} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '600' }}>Conversation</h2>
                <button onClick={handleReset} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Clear (Ctrl+K)">
                  <RefreshCw size={14} />
                </button>
              </div>

              <VoiceInput onTranscript={(text) => handleProcessNotes(text)} />
            </div>

            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <TemplateLibrary onTemplateSelect={(t) => setNoteInput(t)} />
                  <div style={{ marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <Sparkles size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p>AI Ready • {specialty} Mode</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    backgroundColor: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-primary)',
                    color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    maxWidth: '85%',
                    fontSize: '0.9rem',
                    boxShadow: 'var(--shadow-sm)',
                    animation: 'fadeIn 0.3s'
                  }}>
                    <FormattedMessage content={msg.content} />
                  </div>
                ))
              )}
              {isSending && (
                <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <Loader2 size={16} className="spin" /> Thinking...
                </div>
              )}
            </div>

            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)', backgroundColor: 'var(--bg-primary)' }}>
              {/* Input Area */}
              <div style={{ position: 'relative' }}>
                <textarea
                  className="textarea"
                  placeholder="Dictate notes or type..."
                  rows={3}
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleProcessNotes();
                    }
                  }}
                  style={{ resize: 'none', fontSize: '0.95rem' }}
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.75rem' }}
                onClick={() => handleProcessNotes()}
                disabled={isProcessing || !noteInput.trim()}
                title="Ctrl+Enter"
              >
                {isProcessing ? 'Thinking...' : (
                  <>
                    <Send size={16} />
                    Process Notes
                  </>
                )}
              </button>
            </div>
          </aside>

          {/* Right Panel - Workspace */}
          <main style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2rem',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

              <AlertSystem alerts={alerts} />

              {/* AI GENERATED COMPONENTS AREA */}
              {components && components.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                  {components.map((comp, index) => (
                    <div key={index} style={{ width: '100%', animation: `slideInUp 0.4s ease-out ${index * 0.1}s both` }}>
                      {comp}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  flexDirection: 'column',
                  gap: '1rem',
                  minHeight: '60vh'
                }}>
                  <LogoIcon size={64} style={{ opacity: 0.1 }} />
                  <p>AI Workspace Empty</p>
                </div>
              )}

            </div>
          </main>
        </div>

        <div className="keyboard-shortcuts-hint">
          <span><kbd>Ctrl+Enter</kbd> Process</span>
          <span><kbd>Ctrl+K</kbd> Clear</span>
          <span><kbd>Ctrl+P</kbd> Export</span>
        </div>
      </div>
    </PatientProvider>
  );
}

function App() {
  return (
    <TamboProvider
      components={tamboConfig}
      apiKey={import.meta.env.VITE_TAMBO_API_KEY}
    >
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </TamboProvider>
  );
}

export default App;