import { useEffect, useMemo, useState } from 'react';
import { ThemeContext } from './contexts.js';

const readStoredTheme = () => {
    try {
        const stored = localStorage.getItem('theme');
        return stored === 'light' || stored === 'dark' ? stored : 'dark';
    } catch {
        return 'dark';
    }
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(readStoredTheme);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        try {
            localStorage.setItem('theme', theme);
        } catch {
            /* storage unavailable (private mode) — the theme still applies */
        }
    }, [theme]);

    const value = useMemo(() => ({
        theme,
        toggleTheme: () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
    }), [theme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
