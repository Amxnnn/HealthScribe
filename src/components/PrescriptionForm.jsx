import { useId, useRef } from 'react';
import { Pill, Plus } from 'lucide-react';
import { generateMedicalPDF } from '../utils/pdfExport';
import { usePatientData, useToast, useRecordSection } from '../context/contexts.js';

// Keyed by the caller on defaultValue, since an uncontrolled input ignores
// later prop changes — the values stream in after the first render.
const Field = ({ name, label, defaultValue, placeholder, required }) => {
    const id = useId();
    return (
        <div className="form-group">
            <label className="label" htmlFor={id}>{label}</label>
            <input
                id={id}
                name={name}
                type="text"
                className="input"
                defaultValue={defaultValue || ''}
                placeholder={placeholder}
                required={required}
            />
        </div>
    );
};

const PrescriptionForm = ({ medication, dosage, frequency, duration, instructions }) => {
    const extractedData = usePatientData();
    const toast = useToast();
    const formRef = useRef(null);

    // Surface whatever is typed here to the global PDF export
    useRecordSection('prescription', () => {
        if (!formRef.current) return null;
        const data = Object.fromEntries(new FormData(formRef.current));
        delete data.labs;
        return data;
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const medicationName = (formData.get('medication') || '').trim();

        if (!medicationName) {
            toast('Enter a medication name before generating.', 'error');
            return;
        }

        generateMedicalPDF({
            patientInfo: extractedData.patientInfo || { name: 'Unknown Patient' },
            prescription: {
                medication: medicationName,
                dosage: formData.get('dosage'),
                frequency: formData.get('frequency'),
                duration: formData.get('duration'),
                instructions: formData.get('instructions')
            }
        });

        toast('Prescription PDF generated.');
    };

    return (
        <div className="card">
            <div className="section-title">
                <Pill size={17} className="icon-muted" aria-hidden="true" />
                <span>Prescription</span>
            </div>

            <form onSubmit={handleSubmit} ref={formRef} noValidate>
                <div className="grid-cols-2">
                    <Field key={`med-${medication}`} name="medication" label="Medication" defaultValue={medication} placeholder="e.g. Amoxicillin" />
                    <Field key={`dose-${dosage}`} name="dosage" label="Dosage" defaultValue={dosage} placeholder="e.g. 500mg" />
                </div>

                <div className="grid-cols-2">
                    <Field key={`freq-${frequency}`} name="frequency" label="Frequency" defaultValue={frequency} placeholder="e.g. Twice daily" />
                    <Field key={`dur-${duration}`} name="duration" label="Duration" defaultValue={duration} placeholder="e.g. 7 days" />
                </div>

                <Field key={`instr-${instructions}`} name="instructions" label="Special instructions" defaultValue={instructions} placeholder="e.g. Take with food" />

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.25rem' }}>
                    <Plus size={16} aria-hidden="true" />
                    Generate prescription
                </button>
            </form>
        </div>
    );
};

export default PrescriptionForm;
