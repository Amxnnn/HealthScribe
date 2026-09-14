import { User, AlertCircle } from 'lucide-react';

const PatientCard = ({ name, age, gender, complaint }) => {
    const meta = [
        age ? `${age} years` : 'Age not recorded',
        gender || 'Gender not recorded'
    ];

    return (
        <div className="card">
            <div className="section-title">
                <User size={17} className="icon-muted" aria-hidden="true" />
                <span>Patient Information</span>
            </div>

            <h2 style={{ fontSize: '1.375rem', fontWeight: 650, letterSpacing: '-0.022em', color: 'var(--text-primary)' }}>
                {name || 'Unknown patient'}
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.1875rem', marginBottom: '1.125rem' }}>
                <span>{meta[0]}</span>
                <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>•</span>
                <span style={{ textTransform: 'capitalize' }}>{meta[1]}</span>
            </div>

            <div style={{
                backgroundColor: 'var(--bg-tertiary)',
                padding: '0.875rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)'
            }}>
                <div className="field-label">
                    <AlertCircle size={13} className="icon-muted" aria-hidden="true" />
                    Chief complaint
                </div>
                <p style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', lineHeight: 1.55 }}>
                    {complaint || 'No chief complaint recorded.'}
                </p>
            </div>
        </div>
    );
};

export default PatientCard;
