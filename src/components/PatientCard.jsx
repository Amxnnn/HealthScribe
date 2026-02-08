import React from 'react';
import { User, Calendar, Activity, AlertCircle } from 'lucide-react';

const PatientCard = ({ name, age, gender, complaint }) => {
    return (
        <div className="card" style={{ animation: 'slideIn 0.3s ease' }}>
            <div className="section-title">
                <User size={20} className="text-secondary" />
                <span>Patient Information</span>
            </div>

            <div className="patient-info">
                <div className="info-header" style={{ marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {name || "Unknown Patient"}
                    </h2>
                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                        <span>{age ? `${age} years` : "Age not recorded"}</span>
                        <span>•</span>
                        <span style={{ textTransform: 'capitalize' }}>{gender || "Gender not recorded"}</span>
                    </div>
                </div>

                <div style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '4px solid var(--accent-primary)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <AlertCircle size={14} />
                        CHIEF COMPLAINT
                    </div>
                    <p style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                        {complaint || "No chief complaint recorded."}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PatientCard;
