import { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, Square } from 'lucide-react';

// How long a speaker must pause before the buffered phrases are sent
const PAUSE_BEFORE_SEND = 1500;

const ERROR_COPY = {
    'not-allowed': 'Microphone blocked. Allow access in your browser settings.',
    'service-not-allowed': 'Microphone blocked. Allow access in your browser settings.',
    'no-speech': 'No speech detected. Try again.',
    'audio-capture': 'No microphone found. Check your input device.',
    network: 'Speech service unreachable. Check your connection.'
};

export default function VoiceInput({ onTranscript }) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState('');
    // Capability check, not synced state — resolve it before the first paint
    const [isSupported] = useState(
        () => typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
    );
    const recognitionRef = useRef(null);
    // Ref keeps the live callback reachable without re-creating the recognizer
    const onTranscriptRef = useRef(onTranscript);
    // Finished phrases waiting to be sent as one utterance
    const pendingRef = useRef('');
    const flushTimerRef = useRef(null);
    // Whether the clinician still wants to be recording, independent of
    // whether the engine happens to be running right now
    const wantListeningRef = useRef(false);
    const restartsRef = useRef({ count: 0, since: 0 });

    useEffect(() => {
        onTranscriptRef.current = onTranscript;
    }, [onTranscript]);

    // The recogniser marks a phrase final at every natural pause. Sending each
    // one separately would bill a request per breath and hand the model
    // sentence fragments, so hold them until the speaker actually stops.
    // Only touch refs, so these stay stable for the recogniser's handlers
    const flush = useCallback(() => {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
        const text = pendingRef.current.trim();
        pendingRef.current = '';
        if (text) onTranscriptRef.current?.(text);
    }, []);

    const scheduleFlush = useCallback(() => {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = setTimeout(flush, PAUSE_BEFORE_SEND);
    }, [flush]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognizer = new SpeechRecognition();
        recognizer.continuous = true;
        recognizer.interimResults = true;
        recognizer.lang = 'en-US';

        recognizer.onresult = (event) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const text = event.results[i][0].transcript;
                if (event.results[i].isFinal) final += text + ' ';
                else interim += text;
            }

            setTranscript(final + interim);
            if (final) {
                pendingRef.current += final;
                scheduleFlush();
            }
        };

        recognizer.onerror = (event) => {
            // 'aborted' is a deliberate stop; 'no-speech' just means a quiet
            // stretch. Neither is worth showing, and onend resumes after both.
            if (event.error === 'aborted' || event.error === 'no-speech') return;

            console.error('Speech recognition error:', event.error);
            setError(ERROR_COPY[event.error] || 'Voice input failed. Try again.');
            wantListeningRef.current = false;
            setIsListening(false);
        };

        recognizer.onend = () => {
            flush();

            if (!wantListeningRef.current) {
                setIsListening(false);
                return;
            }

            // Chrome ends the session after a few seconds of silence even with
            // continuous set, so a pause to think would otherwise end dictation
            // mid-note. Resume, but give up if it starts flapping.
            const now = Date.now();
            const restarts = restartsRef.current;
            if (now - restarts.since > 10000) {
                restarts.count = 0;
                restarts.since = now;
            }
            restarts.count += 1;

            if (restarts.count > 8) {
                wantListeningRef.current = false;
                setIsListening(false);
                setError('Voice input kept dropping out. Check your microphone and try again.');
                return;
            }

            try {
                recognizer.start();
            } catch {
                wantListeningRef.current = false;
                setIsListening(false);
            }
        };

        recognitionRef.current = recognizer;

        return () => {
            wantListeningRef.current = false; // stop onend from resuming
            recognizer.onresult = null;
            recognizer.onerror = null;
            recognizer.onend = null;
            clearTimeout(flushTimerRef.current);
            try { recognizer.abort(); } catch { /* already stopped */ }
        };
    }, [flush, scheduleFlush]);

    const toggleListening = () => {
        const recognizer = recognitionRef.current;
        if (!recognizer) return;

        if (isListening) {
            wantListeningRef.current = false; // must precede stop(), or onend resumes
            try { recognizer.stop(); } catch { /* already stopped */ }
            setIsListening(false);
            flush();
            return;
        }

        setError('');
        setTranscript('');
        pendingRef.current = '';
        restartsRef.current = { count: 0, since: Date.now() };
        wantListeningRef.current = true;

        try {
            recognizer.start();
            setIsListening(true);
        } catch (e) {
            // InvalidStateError means it is already running — adopt that state
            // rather than telling the clinician it failed.
            if (e?.name === 'InvalidStateError') {
                setIsListening(true);
                return;
            }
            console.error('Could not start speech recognition:', e);
            setError('Voice input is busy. Try again in a moment.');
            wantListeningRef.current = false;
            setIsListening(false);
        }
    };

    if (!isSupported) return null;

    return (
        <div className="voice-input">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <button
                    type="button"
                    onClick={toggleListening}
                    className={`mic-button ${isListening ? 'listening' : ''}`}
                    title={isListening ? 'Stop recording' : 'Start voice input'}
                    aria-label={isListening ? 'Stop recording' : 'Start voice input'}
                    aria-pressed={isListening}
                >
                    {isListening ? <Square size={14} fill="currentColor" /> : <Mic size={17} />}
                    {isListening && <span className="pulse-ring" aria-hidden="true" />}
                </button>
                {isListening && <span className="listening-label">Listening…</span>}
            </div>

            {isListening && transcript && (
                <p className="transcript-preview">{transcript}</p>
            )}

            {error && <p className="voice-error" role="status">{error}</p>}
        </div>
    );
}
