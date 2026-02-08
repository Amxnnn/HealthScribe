import React, { useRef, useEffect } from 'react';
import { FileText } from 'lucide-react';

const SoapSection = ({ label, value, onChange, placeholder }) => {
    const textareaRef = useRef(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [value]);

    return (
        <div className="form-group">
            <label className="label">{label}</label>
            <textarea
                ref={textareaRef}
                className="textarea"
                value={value || ""}
                placeholder={placeholder}
                readOnly={!onChange}
                onChange={onChange}
                rows={3}
                style={{ resize: 'none', overflow: 'hidden', minHeight: '80px' }}
            />
        </div>
    );
};

const SoapNotes = ({ subjective, objective, assessment, plan }) => {
    return (
        <div className="card" style={{ animation: 'slideIn 0.3s ease' }}>
            <div className="section-title">
                <FileText size={20} className="text-secondary" />
                <span>SOAP Notes</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <SoapSection
                    label="Subjective"
                    value={subjective}
                    placeholder="Patient's history and symptoms..."
                />
                <SoapSection
                    label="Objective"
                    value={objective}
                    placeholder="Physical exam findings, vital signs..."
                />
                <SoapSection
                    label="Assessment"
                    value={assessment}
                    placeholder="Diagnosis and differential diagnoses..."
                />
                <SoapSection
                    label="Plan"
                    value={plan}
                    placeholder="Treatment plan, medications, follow-up..."
                />
            </div>
        </div>
    );
};

export default SoapNotes;
