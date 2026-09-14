import { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Menu, Stethoscope, RefreshCw, Loader2, FileDown, Sun, Moon, X, MessageSquare, Pencil } from 'lucide-react';
import { TamboProvider, useTambo } from '@tambo-ai/react';
import { tamboConfig } from './config/tamboConfig';
import { PatientProvider } from './context/PatientContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { useTheme, useToast, useRecordCollector } from './context/contexts.js';
import { RecordProvider } from './context/RecordContext.jsx';

import SpecialtySelector from './components/SpecialtySelector';
import StatsBar from './components/StatsBar';
import VoiceInput from './components/VoiceInput';
import AlertSystem from './components/AlertSystem';
import TemplateLibrary from './components/TemplateLibrary';
import ErrorBoundary from './components/ErrorBoundary';
import { generateMedicalPDF } from './utils/pdfExport';
import { parseMedicalNotes, deriveObjective } from './utils/medicalParser';
import { useAutosize } from './hooks/useAutosize';

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const MOD_KEY = IS_MAC ? '⌘' : 'Ctrl';

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

// What the clinician sees on screen wins over what the parser guessed, so a
// corrected vital or a rewritten plan is what actually reaches the PDF.
const mergeRecord = (parsed, live) => {
  const merged = { ...parsed };
  for (const [section, value] of Object.entries(live)) {
    if (Array.isArray(value)) {
      if (value.length) merged[section] = value;
    } else if (value && typeof value === 'object') {
      merged[section] = { ...(parsed[section] || {}), ...value };
    }
  }

  // When the Objective line was auto-built from vitals rather than dictated,
  // refresh it — otherwise a corrected reading leaves the PDF contradicting
  // itself, with one BP in the table and another in the narrative.
  const wasDerived = parsed.soap?.objective === deriveObjective(parsed.vitals || {});
  if (wasDerived && merged.vitals) {
    merged.soap = { ...merged.soap, objective: deriveObjective(merged.vitals) };
  }

  return merged;
};

// True only when the parsed record would actually put something in the PDF,
// so we never hand the clinician a document containing just a header.
const hasExportableData = (data) => {
  if (!data) return false;
  const { patientInfo, vitals, prescription, labOrders, soap } = data;
  return Boolean(
    patientInfo?.name ||
    (vitals && Object.keys(vitals).length > 0) ||
    prescription?.medication ||
    labOrders?.length > 0 ||
    (soap && Object.values(soap).some(v => v && v.trim()))
  );
};

// Markdown Renderer Component
const FormattedMessage = ({ content }) => {
  const text = extractTextFromMessage(content);
  const sections = text.split('\n');

  return (
    <>
      {sections.map((section, i) => {
        if (!section) return <br key={i} />;

        // Simple parser for **bold** text
        const parts = section.split(/(\*\*.*?\*\*)/g);

        return (
          <p key={i} style={{ margin: '0 0 0.25rem 0' }}>
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
                return <strong key={j}>{part.slice(2, -2)}</strong>;
              }
              // While a reply streams in, the closing ** has not arrived yet —
              // emphasise the run rather than showing the raw asterisks.
              if (part.startsWith('**')) {
                return <strong key={j}>{part.slice(2)}</strong>;
              }
              return <span key={j}>{part}</span>;
            })}
          </p>
        );
      })}
    </>
  );
};

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="btn btn-icon"
      title={`Switch to ${next} mode`}
      aria-label={`Switch to ${next} mode`}
    >
      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
};

function AppContent() {
  const [noteInput, setNoteInput] = useState('');
  const [specialty, setSpecialty] = useState('general');
  const [stats, setStats] = useState({ componentCount: 0, aiCalls: 0 });
  const [alerts, setAlerts] = useState([]);
  const [extractedData, setExtractedData] = useState({});
  const [isSending, setIsSending] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingReset, setPendingReset] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);
  const toast = useToast();
  const collectRecord = useRecordCollector();
  const scrollRef = useRef(null);
  const composerRef = useRef(null);
  const resetTimerRef = useRef(null);
  // Mirrors isSending for callbacks that fire outside the render cycle
  const sendingRef = useRef(false);
  const queuedRef = useRef('');

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

  const { currentThread, sendThreadMessage } = tambo || {};

  const allMessages = useMemo(() => currentThread?.messages || [], [currentThread]);
  // A turn that only renders a component has no text; showing it would leave
  // an empty bubble floating in the transcript.
  const messages = useMemo(
    () => allMessages.filter(m => extractTextFromMessage(m.content).trim()),
    [allMessages]
  );
  const components = useMemo(
    () => allMessages.filter(m => m.renderedComponent).map(m => m.renderedComponent),
    [allMessages]
  );

  const isProcessing = isSending;
  // Rendered cards are exportable even when the regex parser found nothing
  const canExport = hasExportableData(extractedData) || components.length > 0;

  // Track Stats
  useEffect(() => {
    if (components.length && components.length !== stats.componentCount) {
      setStats(prev => ({ ...prev, componentCount: components.length }));
    }
  }, [components.length, stats.componentCount]);

  // Keep the newest message in view as the thread grows
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, isSending]);

  // Grow the composer with its content instead of clipping a template mid-line
  useAutosize(composerRef, noteInput, 180);

  useEffect(() => () => clearTimeout(resetTimerRef.current), []);

  // Hybrid Logic: local parser drives alerts + PDF data, the AI drives the UI
  const messageLength = allMessages.length;
  useEffect(() => {
    if (messageLength === 0) return;

    const fullContext = allMessages
      .filter(m => m.role === 'user')
      .map(m => extractTextFromMessage(m.content))
      .join(' ');

    if (!fullContext) return;

    const parsed = parseMedicalNotes(fullContext);
    setExtractedData(parsed);

    const newAlerts = [];
    if (parsed.vitals) {
      if (parsed.vitals.bp) {
        const [sys, dia] = parsed.vitals.bp.split('/').map(Number);
        if (sys >= 160 || dia >= 100) newAlerts.push({ severity: 'critical', title: 'Hypertension warning', message: `BP ${parsed.vitals.bp} is significantly elevated.` });
      }
      if (parsed.vitals.temp && parseFloat(parsed.vitals.temp) > 102) {
        newAlerts.push({ severity: 'warning', title: 'High fever', message: 'Detailed fever workup recommended.' });
      }
      if (parsed.vitals.o2Sat && parseInt(parsed.vitals.o2Sat) < 92) {
        newAlerts.push({ severity: 'critical', title: 'Hypoxia alert', message: 'Consider immediate O2 therapy.' });
      }
    }
    if (parsed.prescription?.medication) {
      const meds = parsed.prescription.medication.toLowerCase();
      if (meds.includes('warfarin') && meds.includes('aspirin')) {
        newAlerts.push({ severity: 'critical', title: 'Interaction alert', message: 'Warfarin + Aspirin increases bleeding risk.' });
      }
    }
    setAlerts(newAlerts);
    // allMessages is derived from messageLength; re-running per length is intentional
  }, [messageLength, allMessages]);

  const handleProcessNotes = async (text = noteInput) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Dictation does not wait for the model. Queue anything that arrives
    // mid-request instead of discarding it — dropping it silently lost
    // whatever the clinician had just said.
    if (sendingRef.current) {
      queuedRef.current = queuedRef.current ? `${queuedRef.current} ${trimmed}` : trimmed;
      setQueuedCount(c => c + 1);
      setNoteInput('');
      return;
    }

    sendingRef.current = true;
    setNoteInput('');
    setIsSending(true);
    setStats(p => ({ ...p, aiCalls: p.aiCalls + 1 }));

    if (typeof sendThreadMessage !== 'function') {
      console.error('Tambo SDK Error: sendThreadMessage is not a function.', Object.keys(tambo || {}));
      toast('Cannot reach the AI service. Check your API key.', 'error');
      sendingRef.current = false;
      setIsSending(false);
      setNoteInput(trimmed); // hand the text back rather than losing it
      return;
    }

    try {
      await sendThreadMessage(trimmed);
    } catch (e) {
      console.error('Tambo SDK sendThreadMessage failed:', e);
      toast('Could not process those notes. Your text was restored.', 'error');
      setNoteInput(trimmed); // give the dictation back rather than losing it
    } finally {
      sendingRef.current = false;
      setIsSending(false);

      // Send whatever was dictated while this request was in flight
      if (queuedRef.current) {
        const next = queuedRef.current;
        queuedRef.current = '';
        setQueuedCount(0);
        handleProcessNotes(next);
      }
    }
  };

  const doReset = () => {
    if (tambo?.startNewThread) {
      tambo.startNewThread();
    } else if (tambo?.reset) {
      tambo.reset();
    }

    setNoteInput('');
    setAlerts([]);
    setExtractedData({});
    setStats({ componentCount: 0, aiCalls: 0 });
    setIsSending(false);
    sendingRef.current = false;
    queuedRef.current = '';
    setQueuedCount(0);
    setIsSidebarOpen(false);
    setPendingReset(false);
    clearTimeout(resetTimerRef.current);
  };

  // Clearing discards a whole documentation session and the thread cannot be
  // recovered, so ask once when there is actually something to lose.
  const handleReset = () => {
    const hasContent = messages.length > 0 || noteInput.trim().length > 0;
    if (!hasContent || pendingReset) {
      doReset();
      return;
    }
    setPendingReset(true);
    clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => setPendingReset(false), 4000);
  };

  const handleExportPDF = () => {
    const record = mergeRecord(extractedData, collectRecord());
    if (!hasExportableData(record)) {
      toast('Nothing to export yet — process some notes first.', 'error');
      return;
    }
    generateMedicalPDF(record);
    toast('PDF exported.');
  };

  // Keyboard shortcuts. Handlers live in a ref so the listener always sees
  // current state without rebinding (the old deps list went stale on export).
  const handlers = useRef({});
  handlers.current = { handleProcessNotes, handleReset, handleExportPDF };

  useEffect(() => {
    const onKeyDown = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) {
        if (e.key === 'Escape') setIsSidebarOpen(false);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        handlers.current.handleProcessNotes();
      } else if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handlers.current.handleReset();
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlers.current.handleExportPDF();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const specialtyLabel = specialty.charAt(0).toUpperCase() + specialty.slice(1);

  return (
    <PatientProvider data={extractedData}>
      <div className="app-shell">
        <header className="app-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
            <button
              type="button"
              className="btn btn-icon mobile-only"
              style={{ display: 'none' }}
              onClick={() => setIsSidebarOpen(v => !v)}
              aria-label={isSidebarOpen ? 'Close notes panel' : 'Open notes panel'}
              aria-expanded={isSidebarOpen}
            >
              {isSidebarOpen ? <X size={17} /> : <Menu size={17} />}
            </button>

            <h1 className="wordmark">
              HealthScribe
              <span className="wordmark-badge">PRO</span>
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <StatsBar stats={stats} />
            <ThemeToggle />
            <button
              type="button"
              onClick={handleExportPDF}
              className="btn btn-ghost"
              disabled={!canExport}
              title={canExport ? `Export PDF (${MOD_KEY}+P)` : 'Process notes before exporting'}
            >
              <FileDown size={14} />
              <span className="export-label">Export PDF</span>
            </button>
          </div>
        </header>

        <div className="app-body">
          {isSidebarOpen && (
            <button
              type="button"
              className="sidebar-overlay"
              aria-label="Close notes panel"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`} aria-label="Notes and conversation">
            <div className="sidebar-head">
              <SpecialtySelector onSpecialtyChange={setSpecialty} currentSpecialty={specialty} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
                <h2 className="eyebrow" style={{ marginBottom: 0 }}>Conversation</h2>
                <button
                  type="button"
                  onClick={handleReset}
                  className={`btn btn-clear ${pendingReset ? 'is-confirming' : ''}`}
                  title={`Clear conversation (${MOD_KEY}+K)`}
                  aria-label={pendingReset ? 'Confirm clearing the conversation' : 'Clear conversation'}
                >
                  <RefreshCw size={13} aria-hidden="true" />
                  {pendingReset && <span>Discard?</span>}
                </button>
              </div>

              <VoiceInput onTranscript={(text) => handleProcessNotes(text)} />
            </div>

            <div className="sidebar-scroll" ref={scrollRef}>
              {messages.length === 0 ? (
                <>
                  <TemplateLibrary onTemplateSelect={(t) => setNoteInput(t)} />
                  <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
                    <MessageSquare size={20} style={{ opacity: 0.4, marginBottom: '0.5rem' }} aria-hidden="true" />
                    <p style={{ fontSize: '0.8125rem' }}>
                      Ready in <strong style={{ color: 'var(--text-secondary)', fontWeight: 550 }}>{specialtyLabel}</strong> mode
                    </p>
                  </div>
                </>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`msg ${msg.role === 'user' ? 'msg-user' : 'msg-ai'}`}>
                    <FormattedMessage content={msg.content} />
                  </div>
                ))
              )}
              {isSending && (
                <div className="thinking">
                  <Loader2 size={15} className="spin" aria-hidden="true" />
                  Thinking…
                  {queuedCount > 0 && (
                    <span className="queued-note">
                      +{queuedCount} more dictated
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="sidebar-foot">
              <label htmlFor="note-input" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
                Clinical notes
              </label>
              <textarea
                id="note-input"
                ref={composerRef}
                className="textarea"
                placeholder="Dictate notes or type…"
                rows={3}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleProcessNotes();
                  }
                }}
                style={{ resize: 'none', minHeight: '76px', maxHeight: '180px' }}
              />
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.625rem' }}
                onClick={() => handleProcessNotes()}
                disabled={isProcessing || !noteInput.trim()}
                title={`Process notes (${MOD_KEY}+Enter)`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={15} className="spin" aria-hidden="true" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Send size={15} aria-hidden="true" />
                    Process notes
                  </>
                )}
              </button>
            </div>
          </aside>

          <main className="workspace">
            <div className="workspace-inner">
              <AlertSystem alerts={alerts} />

              {components.length > 0 ? (
                <div className="workspace-grid">
                  {components.map((comp, index) => (
                    <div
                      key={index}
                      className="card-enter"
                      style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
                    >
                      <ErrorBoundary>{comp}</ErrorBoundary>
                    </div>
                  ))}
                </div>
              ) : isSending ? (
                <div className="workspace-pending">
                  <Loader2 size={15} className="spin" aria-hidden="true" />
                  Building your documentation…
                </div>
              ) : (
                <div className="empty-workspace">
                  <div className="empty-workspace-mark">
                    <Stethoscope size={22} aria-hidden="true" />
                  </div>
                  <p className="empty-title">No documentation yet</p>
                  <p className="empty-hint">
                    Dictate or paste a clinical note and structured records will appear here.
                  </p>
                  {/* On phones the composer lives in the off-canvas panel,
                      so the empty state has to offer a way in. */}
                  <button
                    type="button"
                    className="btn btn-ghost mobile-only"
                    style={{ display: 'none', marginTop: '0.5rem' }}
                    onClick={() => setIsSidebarOpen(true)}
                  >
                    <Pencil size={14} aria-hidden="true" />
                    Start a note
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>

        <div className="keyboard-shortcuts-hint" aria-hidden="true">
          <span><kbd>{MOD_KEY}+↵</kbd> Process</span>
          <span><kbd>{MOD_KEY}+K</kbd> Clear</span>
          <span><kbd>{MOD_KEY}+P</kbd> Export</span>
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
        <ToastProvider>
          <RecordProvider>
            <AppContent />
          </RecordProvider>
        </ToastProvider>
      </ThemeProvider>
    </TamboProvider>
  );
}

export default App;
