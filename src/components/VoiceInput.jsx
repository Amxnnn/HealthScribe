import { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

export default function VoiceInput({ onTranscript }) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [recognition, setRecognition] = useState(null);

    useEffect(() => {
        // Initialize Web Speech API
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognizer = new SpeechRecognition();

            recognizer.continuous = true;
            recognizer.interimResults = true;
            recognizer.lang = 'en-US';

            recognizer.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                const currentText = finalTranscript + interimTranscript;
                setTranscript(currentText);

                // Auto-send final results to parent if we have content
                if (finalTranscript) {
                    onTranscript(finalTranscript.trim());
                }
            };

            recognizer.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognizer.onend = () => {
                setIsListening(false);
            };

            setRecognition(recognizer);
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognition?.stop();
            setIsListening(false);
        } else {
            recognition?.start();
            setIsListening(true);
            setTranscript('');
        }
    };

    if (!recognition) return null; // Hide if not supported

    return (
        <div className="voice-input" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                    onClick={toggleListening}
                    className={`mic-button ${isListening ? 'listening' : ''}`}
                    title={isListening ? 'Stop recording' : 'Start voice input'}
                    style={{
                        background: isListening ? '#ef4444' : 'var(--bg-tertiary)',
                        color: isListening ? 'white' : 'var(--text-primary)',
                        border: isListening ? 'none' : '1px solid var(--border-medium)',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative'
                    }}
                >
                    {isListening ? (
                        <MicOff size={20} />
                    ) : (
                        <Mic size={20} />
                    )}
                    {isListening && <div className="pulse-ring"></div>}
                </button>
                {isListening && (
                    <span className="text-xs text-red-500 font-medium animate-pulse">Listening...</span>
                )}
            </div>

            {isListening && transcript && (
                <div className="transcript-preview" style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic'
                }}>
                    {transcript}
                </div>
            )}
        </div>
    );
}
