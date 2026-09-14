import { Lightbulb, AlertTriangle, FileText } from 'lucide-react';

const ClinicalInsights = ({ suggestions = [], riskAssessment, billingCodes }) => {
    const codes = [
        ...(billingCodes?.icd10 || []).map(code => ({ kind: 'ICD-10', code })),
        ...(billingCodes?.rxNorm || []).map(code => ({ kind: 'RxNorm', code }))
    ];

    if (!suggestions.length && !riskAssessment && !codes.length) return null;

    return (
        <div className="card card-accent">
            <div className="section-title">
                <Lightbulb size={17} className="icon-muted" aria-hidden="true" />
                <span>Clinical Intelligence</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                {riskAssessment && (
                    <div className="alert alert-critical" style={{ animation: 'none' }}>
                        <AlertTriangle size={15} className="alert-icon" aria-hidden="true" />
                        <div>
                            <p className="alert-title">Risk assessment</p>
                            <p>{riskAssessment}</p>
                        </div>
                    </div>
                )}

                {suggestions.length > 0 && (
                    <div>
                        <div className="field-label">Suggested next steps</div>
                        <ul style={{ margin: 0, paddingLeft: '1.125rem', display: 'flex', flexDirection: 'column', gap: '0.3125rem' }}>
                            {suggestions.map((s, i) => (
                                <li key={i} style={{ fontSize: '0.875rem', lineHeight: 1.55, color: 'var(--text-primary)' }}>{s}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {codes.length > 0 && (
                    <div style={{ paddingTop: '0.875rem', borderTop: '1px solid var(--border-light)' }}>
                        <div className="field-label">
                            <FileText size={13} className="icon-muted" aria-hidden="true" />
                            Medical coding
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                            {codes.map(({ kind, code }, i) => (
                                <span key={`${kind}-${i}`} className="code-chip">
                                    {kind} <strong>{code}</strong>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClinicalInsights;
