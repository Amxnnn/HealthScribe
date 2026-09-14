import { useRef } from 'react';
import { Beaker, CheckSquare } from 'lucide-react';
import { generateMedicalPDF } from '../utils/pdfExport';
import { usePatientData, useToast, useRecordSection } from '../context/contexts.js';

const COMMON_LABS = [
    'CBC', 'CMP', 'Lipid Panel',
    'HbA1c', 'Urinalysis', 'TSH',
    'Vitamin D', 'Iron Panel', 'Coagulation'
];

const normalise = (s) => String(s ?? '').trim().toLowerCase();

const LabCheckbox = ({ label, checked }) => (
    <label className="lab-checkbox">
        <input type="checkbox" name="labs" value={label} defaultChecked={checked} />
        <span>{label}</span>
    </label>
);

const LabOrderForm = ({ selectedLabs = [] }) => {
    const extractedData = usePatientData();
    const toast = useToast();
    const formRef = useRef(null);

    const requested = (Array.isArray(selectedLabs) ? selectedLabs : []).filter(Boolean);
    const requestedKeys = new Set(requested.map(normalise));

    // The model writes labs in its own casing ("lipid panel"), and may name a
    // test that is not on the standard list. Match loosely, and render anything
    // extra rather than dropping an order the clinician actually dictated.
    const extras = requested.filter(
        lab => !COMMON_LABS.some(known => normalise(known) === normalise(lab))
    );
    const labs = [...COMMON_LABS, ...extras];

    // Surface the currently ticked labs to the global PDF export
    useRecordSection('labOrders', () =>
        formRef.current ? new FormData(formRef.current).getAll('labs') : null
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        const ordered = new FormData(e.target).getAll('labs');

        if (ordered.length === 0) {
            toast('Select at least one lab to order.', 'error');
            return;
        }

        generateMedicalPDF({
            patientInfo: extractedData.patientInfo || { name: 'Lab Requisition' },
            labOrders: ordered
        });

        toast(`Requisition generated for ${ordered.length} ${ordered.length === 1 ? 'lab' : 'labs'}.`);
    };

    return (
        <div className="card">
            <div className="section-title">
                <Beaker size={17} className="icon-muted" aria-hidden="true" />
                <span>Lab Orders</span>
            </div>

            <form onSubmit={handleSubmit} ref={formRef}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(140px, 100%), 1fr))',
                    gap: '0.5rem',
                    marginBottom: '1.25rem'
                }}>
                    {labs.map(lab => (
                        <LabCheckbox
                            /* Keyed on the model's selection: defaultChecked only
                               applies on mount, so a card that first rendered
                               empty while streaming would never tick. */
                            key={`${lab}:${requestedKeys.has(normalise(lab))}`}
                            label={lab}
                            checked={requestedKeys.has(normalise(lab))}
                        />
                    ))}
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    <CheckSquare size={16} aria-hidden="true" />
                    Order selected labs
                </button>
            </form>
        </div>
    );
};

export default LabOrderForm;
