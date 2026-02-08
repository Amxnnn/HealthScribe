import React from 'react';
import { Lightbulb, AlertTriangle, FileText, CheckCircle } from 'lucide-react';

const ClinicalInsights = ({ suggestions = [], riskAssessment, billingCodes }) => {
    // Safety check for empty data
    if (!suggestions.length && !riskAssessment && !billingCodes) return null;

    return (
        <div className="card" style={{ animation: 'slideIn 0.3s ease', borderLeft: '4px solid var(--accent-primary)' }}>
            <div className="section-title">
                <Lightbulb size={20} className="text-secondary" />
                <span>Clinical Intelligence</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* Risk Assessment / Safety Warnings */}
                {riskAssessment && (
                    <div style={{
                        padding: '1rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        gap: '0.75rem'
                    }}>
                        <AlertTriangle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
                        <div>
                            <h4 style={{ margin: '0 0 0.25rem 0', color: '#ef4444', fontSize: '0.9rem', fontWeight: '600' }}>Risk Assessment</h4>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{riskAssessment}</p>
                        </div>
                    </div>
                )}

                {/* Proactive Suggestions */}
                {suggestions.length > 0 && (
                    <div>
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>SUGGESTED NEXT STEPS</h4>
                        <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {suggestions.map((s, i) => (
                                <li key={i} style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{s}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Medical Coding (ICD-10 / RxNorm) */}
                {billingCodes && (billingCodes.icd10?.length > 0 || billingCodes.rxNorm?.length > 0) && (
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <FileText size={14} className="text-secondary" />
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>MEDICAL CODING</span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {billingCodes.icd10?.map((code, i) => (
                                <span key={`icd-${i}`} style={{
                                    fontSize: '0.8rem',
                                    padding: '0.1rem 0.4rem',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    borderRadius: '4px',
                                    border: '1px solid var(--border-medium)',
                                    fontFamily: 'monospace'
                                }}>
                                    ICD-10: <strong>{code}</strong>
                                </span>
                            ))}
                            {billingCodes.rxNorm?.map((code, i) => (
                                <span key={`rx-${i}`} style={{
                                    fontSize: '0.8rem',
                                    padding: '0.1rem 0.4rem',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    borderRadius: '4px',
                                    border: '1px solid var(--border-medium)',
                                    fontFamily: 'monospace'
                                }}>
                                    RxNorm: <strong>{code}</strong>
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
