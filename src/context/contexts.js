import { createContext, useContext, useEffect, useId, useRef } from 'react';

// Context objects and their hooks live apart from the provider components so
// that each provider file exports only components, which keeps Fast Refresh
// working for them during development.

export const PatientContext = createContext(undefined);
export const ThemeContext = createContext(undefined);
export const ToastContext = createContext(null);
export const RecordContext = createContext(null);

/**
 * Lets an editable clinical card expose its *current* values to the exporter.
 *
 * The card registers a getter rather than pushing state upward: reading on
 * demand keeps the live DOM as the single source of truth and avoids the
 * re-render loops that two-way binding would introduce here.
 *
 * @param {string} section  record key ('vitals', 'soap', 'prescription', …)
 * @param {Function} getter returns this card's current values
 */
export const useRecordSection = (section, getter) => {
    const registry = useContext(RecordContext);
    const id = useId();
    const getterRef = useRef(getter);

    useEffect(() => {
        getterRef.current = getter;
    });

    useEffect(() => {
        if (!registry) return;
        return registry.register(id, section, () => getterRef.current?.());
    }, [registry, id, section]);
};

// Used by the exporter to pull everything currently on screen.
export const useRecordCollector = () => useContext(RecordContext)?.collect ?? (() => ({}));

export const usePatientData = () => {
    const context = useContext(PatientContext);
    if (context === undefined) {
        throw new Error('usePatientData must be used within a PatientProvider');
    }
    return context;
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// Falls back to a no-op so a component rendered outside the provider
// (e.g. in isolation) never crashes on a toast call.
export const useToast = () => useContext(ToastContext)?.toast ?? (() => { });
