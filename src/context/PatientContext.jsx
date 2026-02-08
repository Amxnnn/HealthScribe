import React, { createContext, useContext, useState } from 'react';

const PatientContext = createContext();

export const PatientProvider = ({ children, data }) => {
    return (
        <PatientContext.Provider value={data || {}}>
            {children}
        </PatientContext.Provider>
    );
};

export const usePatientData = () => {
    const context = useContext(PatientContext);
    if (context === undefined) {
        throw new Error('usePatientData must be used within a PatientProvider');
    }
    return context;
};
