import { useMemo, useRef } from 'react';
import { RecordContext } from './contexts.js';

/**
 * Holds a registry of "what is currently on screen" for the clinical cards.
 *
 * Cards render from AI props but are editable, so the values a clinician can
 * see are not necessarily the values the parser extracted. Anything that
 * leaves the app (the PDF) must reflect what was on screen, not the original
 * transcript.
 */
export const RecordProvider = ({ children }) => {
    const registry = useRef(new Map());

    const value = useMemo(() => ({
        register(id, section, getter) {
            registry.current.set(id, { section, getter });
            return () => { registry.current.delete(id); };
        },

        collect() {
            const out = {};
            for (const { section, getter } of registry.current.values()) {
                let data;
                try {
                    data = getter();
                } catch {
                    continue; // a card unmounting mid-collect must not break export
                }
                if (data == null) continue;

                if (Array.isArray(data)) {
                    out[section] = [...(out[section] || []), ...data];
                } else {
                    // Drop empty strings so a blank field never overwrites a
                    // parsed value with nothing.
                    const filled = Object.fromEntries(
                        Object.entries(data).filter(([, v]) => v !== '' && v != null)
                    );
                    out[section] = { ...(out[section] || {}), ...filled };
                }
            }
            return out;
        }
    }), []);

    return <RecordContext.Provider value={value}>{children}</RecordContext.Provider>;
};
