import { PatientContext } from './contexts.js';

export const PatientProvider = ({ children, data }) => (
    <PatientContext.Provider value={data || {}}>
        {children}
    </PatientContext.Provider>
);
