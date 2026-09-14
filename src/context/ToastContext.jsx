import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { ToastContext } from './contexts.js';

const DISMISS_AFTER = 4000;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const timers = useRef(new Map());

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
        const timer = timers.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timers.current.delete(id);
        }
    }, []);

    const toast = useCallback((message, tone = 'success') => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setToasts(prev => [...prev, { id, message, tone }]);
        timers.current.set(id, setTimeout(() => dismiss(id), DISMISS_AFTER));
    }, [dismiss]);

    // Clear any pending timers if the provider unmounts
    useEffect(() => {
        const pending = timers.current;
        return () => {
            pending.forEach(clearTimeout);
            pending.clear();
        };
    }, []);

    const value = useMemo(() => ({ toast }), [toast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="toast-region" role="status" aria-live="polite">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.tone}`}>
                        {t.tone === 'error'
                            ? <AlertCircle size={15} className="toast-icon" aria-hidden="true" />
                            : <Check size={15} className="toast-icon" aria-hidden="true" />}
                        <span>{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
