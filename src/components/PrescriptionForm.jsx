
import React from 'react';
import { Pill, Plus } from 'lucide-react';
import { generateMedicalPDF } from '../utils/pdfExport';
import { usePatientData } from '../context/PatientContext.jsx';

const PrescriptionForm = ({ medication, dosage, frequency, duration, instructions }) => {
    const extractedData = usePatientData();

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const prescriptionData = {
            medication: formData.get('medication'),
            dosage: formData.get('dosage'),
            frequency: formData.get('frequency'),
            duration: formData.get('duration'),
            instructions: formData.get('instructions')
        };

        // Generate PDF for this single prescription with REAL patient data
        generateMedicalPDF({
            patientInfo: extractedData.patientInfo || { name: "Unknown Patient" },
            prescription: prescriptionData
        });

        alert("Prescription generated successfully!");
    };

    return (
        <div className="card" style={{ animation: 'slideIn 0.3s ease' }}>
            <div className="section-title">
                <Pill size={20} className="text-secondary" />
                <span>Prescription</span>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid-cols-2">
                    <div className="form-group">
                        <label className="label">Medication Name</label>
                        <input
                            name="medication"
                            type="text"
                            className="input"
                            defaultValue={medication || ""}
                            placeholder="e.g. Amoxicillin"
                        />
                    </div>
                    <div className="form-group">
                        <label className="label">Dosage</label>
                        <input
                            name="dosage"
                            type="text"
                            className="input"
                            defaultValue={dosage || ""}
                            placeholder="e.g. 500mg"
                        />
                    </div>
                </div>

                <div className="grid-cols-2">
                    <div className="form-group">
                        <label className="label">Frequency</label>
                        <input
                            name="frequency"
                            type="text"
                            className="input"
                            defaultValue={frequency || ""}
                            placeholder="e.g. Twice daily"
                        />
                    </div>
                    <div className="form-group">
                        <label className="label">Duration</label>
                        <input
                            name="duration"
                            type="text"
                            className="input"
                            defaultValue={duration || ""}
                            placeholder="e.g. 7 days"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="label">Special Instructions</label>
                    <input
                        name="instructions"
                        type="text"
                        className="input"
                        defaultValue={instructions || ""}
                        placeholder="e.g. Take with food"
                    />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    <Plus size={18} />
                    Generate Prescription
                </button>
            </form>
        </div>
    );
};

export default PrescriptionForm;
