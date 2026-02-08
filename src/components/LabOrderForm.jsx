import React from 'react';
import { Beaker, CheckSquare } from 'lucide-react';
import { generateMedicalPDF } from '../utils/pdfExport';
import { usePatientData } from '../context/PatientContext.jsx';

const LabCheckbox = ({ label, checked }) => (
    <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        transition: 'all 0.2s'
    }} className="lab-checkbox">
        <input
            type="checkbox"
            name="labs"
            value={label}
            defaultChecked={checked}
            style={{
                width: '1.25rem',
                height: '1.25rem',
                cursor: 'pointer',
                accentColor: 'var(--accent-primary)'
            }}
        />
        <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{label}</span>
    </label>
);

const LabOrderForm = ({ selectedLabs = [] }) => {
    const extractedData = usePatientData();

    const commonLabs = [
        "CBC", "CMP", "Lipid Panel",
        "HbA1c", "Urinalysis", "TSH",
        "Vitamin D", "Iron Panel", "Coagulation"
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const labs = formData.getAll('labs');

        if (labs.length === 0) {
            alert("Please select at least one lab.");
            return;
        }

        // Generate PDF for this lab order
        generateMedicalPDF({
            patientInfo: extractedData.patientInfo || { name: "Lab Requisition" },
            labOrders: labs
        });

        alert(`Ordered ${labs.length} labs successfully!`);
    };

    return (
        <div className="card" style={{ animation: 'slideIn 0.3s ease' }}>
            <div className="section-title">
                <Beaker size={20} className="text-secondary" />
                <span>Lab Orders</span>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '0.75rem',
                    marginBottom: '1.5rem'
                }}>
                    {commonLabs.map(lab => (
                        <LabCheckbox
                            key={lab}
                            label={lab}
                            checked={selectedLabs ? selectedLabs.includes(lab) : false}
                        />
                    ))}
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    <CheckSquare size={18} />
                    Order Selected Labs
                </button>
            </form>
        </div>
    );
};

export default LabOrderForm;
