import { useId, useRef } from 'react';
import { FileText } from 'lucide-react';
import { useAutosize, fitTextarea } from '../hooks/useAutosize';
import { useRecordSection } from '../context/contexts.js';

const SoapSection = ({ name, label, value, placeholder }) => {
    const id = useId();
    const textareaRef = useRef(null);

    useAutosize(textareaRef, value);

    return (
        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="label" htmlFor={id}>{label}</label>
            <textarea
                id={id}
                name={name}
                ref={textareaRef}
                className="textarea"
                defaultValue={value || ''}
                placeholder={placeholder}
                onInput={(e) => fitTextarea(e.target)}
                rows={2}
                style={{ resize: 'none', overflow: 'hidden', minHeight: '64px' }}
            />
        </div>
    );
};

const SoapNotes = ({ subjective, objective, assessment, plan }) => {
    const fieldsRef = useRef(null);

    // The note that gets exported is the one on screen, edits included
    useRecordSection('soap', () => {
        const root = fieldsRef.current;
        if (!root) return null;
        return Object.fromEntries(
            [...root.querySelectorAll('textarea[name]')].map(el => [el.name, el.value.trim()])
        );
    });

    return (
        <div className="card">
            <div className="section-title">
                <FileText size={17} className="icon-muted" aria-hidden="true" />
                <span>SOAP Notes</span>
            </div>

            <div ref={fieldsRef}>
                {/* Keyed on the incoming value so a revised note from the model
                    replaces the field instead of leaving stale text behind. */}
                <SoapSection key={`s-${subjective}`} name="subjective" label="Subjective" value={subjective} placeholder="Patient's history and symptoms…" />
                <SoapSection key={`o-${objective}`} name="objective" label="Objective" value={objective} placeholder="Physical exam findings, vital signs…" />
                <SoapSection key={`a-${assessment}`} name="assessment" label="Assessment" value={assessment} placeholder="Diagnosis and differential diagnoses…" />
                <SoapSection key={`p-${plan}`} name="plan" label="Plan" value={plan} placeholder="Treatment plan, medications, follow-up…" />
            </div>
        </div>
    );
};

export default SoapNotes;
