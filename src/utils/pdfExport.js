import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateMedicalPDF(data) {
    const doc = new jsPDF();

    // -- Colors --
    const primaryColor = [0, 82, 204]; // #0052CC
    const secondaryColor = [240, 240, 240]; // #F0F0F0
    const textColor = [33, 33, 33];
    const lightText = [100, 100, 100];

    // -- Header --
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 35, 'F');

    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text('Medical Documentation', 20, 22);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('HealthScribe PRO', 160, 22, { align: 'right' });

    // Metadata row
    doc.setTextColor(...lightText);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 42);
    doc.text(`ID: ${Date.now().toString().slice(-8)}`, 190, 42, { align: 'right' });

    let yPosition = 50;

    // Helper: Section Title
    const addSectionTitle = (title) => {
        if (yPosition > 260) { doc.addPage(); yPosition = 20; }
        doc.setFontSize(14);
        doc.setTextColor(...primaryColor);
        doc.setFont(undefined, 'bold');
        doc.text(title.toUpperCase(), 20, yPosition);
        doc.setLineWidth(0.5);
        doc.setDrawColor(...primaryColor);
        doc.line(20, yPosition + 2, 190, yPosition + 2);
        yPosition += 10;
        doc.setTextColor(...textColor); // Reset to standard text color
        doc.setFont(undefined, 'normal');
    };

    // -- Patient Information (Grid Layout) --
    if (data.patientInfo && data.patientInfo.name) {
        addSectionTitle('Patient Demographics');

        autoTable(doc, {
            startY: yPosition,
            head: [],
            body: [
                ['Name:', data.patientInfo.name || 'N/A', 'Gender:', data.patientInfo.gender || 'N/A'],
                ['Age:', (data.patientInfo.age ? `${data.patientInfo.age} yrs` : 'N/A'), 'Date:', new Date().toLocaleDateString()],
                ['Complaint:', { content: data.patientInfo.complaint || 'N/A', colSpan: 3 }]
            ],
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 2, valign: 'middle' },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 25 },
                1: { cellWidth: 60 },
                2: { fontStyle: 'bold', cellWidth: 25 },
                3: { cellWidth: 60 }
            },
            margin: { left: 20 }
        });
        yPosition = doc.lastAutoTable.finalY + 10;
    }

    // -- Vital Signs (Table) --
    if (data.vitals && Object.keys(data.vitals).length > 0) {
        addSectionTitle('Vital Signs');

        const vitalBody = [
            ['Blood Pressure', data.vitals.bp || '-', '120/80 mmHg'],
            ['Heart Rate', data.vitals.heartRate ? `${data.vitals.heartRate} bpm` : '-', '60-100 bpm'],
            ['Temperature', data.vitals.temp || '-', '97-99°F'],
            ['Resp. Rate', data.vitals.respRate ? `${data.vitals.respRate} /min` : '-', '12-20 /min'],
            ['O2 Saturation', data.vitals.o2Sat ? `${data.vitals.o2Sat}%` : '-', '>95%'],
        ].filter(r => r[1] !== '-');

        autoTable(doc, {
            startY: yPosition,
            head: [['Measurement', 'Result', 'Reference Range']],
            body: vitalBody,
            theme: 'striped',
            headStyles: { fillColor: secondaryColor, textColor: textColor, fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 3 },
            margin: { left: 20 }
        });
        yPosition = doc.lastAutoTable.finalY + 10;
    }

    // -- Clinical Notes (SOAP) --
    if (data.soap && (data.soap.subjective || data.soap.objective || data.soap.assessment || data.soap.plan)) {
        addSectionTitle('Clinical Documentation');

        const soapSections = [
            { label: 'Subjective', text: data.soap.subjective },
            { label: 'Objective', text: data.soap.objective },
            { label: 'Assessment', text: data.soap.assessment },
            { label: 'Plan', text: data.soap.plan }
        ];

        soapSections.forEach(section => {
            if (section.text && section.text.trim()) {
                if (yPosition > 250) { doc.addPage(); yPosition = 20; }

                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.text(section.label, 20, yPosition);
                yPosition += 6;

                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');

                const splitText = doc.splitTextToSize(section.text, 170);
                doc.text(splitText, 25, yPosition);
                yPosition += (splitText.length * 5) + 8;
            }
        });
    }

    // -- Prescriptions (Table) --
    if (data.prescription && data.prescription.medication) {
        if (yPosition > 240) { doc.addPage(); yPosition = 20; }
        addSectionTitle('Medication Orders');

        autoTable(doc, {
            startY: yPosition,
            head: [['Medication', 'Dosage', 'Frequency', 'Duration']],
            body: [[
                data.prescription.medication,
                data.prescription.dosage || '-',
                data.prescription.frequency || '-',
                data.prescription.duration || '-'
            ]],
            theme: 'grid',
            headStyles: { fillColor: primaryColor, textColor: 255 },
            styles: { fontSize: 10 },
            margin: { left: 20 }
        });
        yPosition = doc.lastAutoTable.finalY + 5;

        if (data.prescription.instructions) {
            doc.setFontSize(9);
            doc.setFont(undefined, 'italic');
            doc.text(`Instructions: ${data.prescription.instructions}`, 20, yPosition + 5);
            yPosition += 15;
        } else {
            yPosition += 10;
        }
    }

    // -- Lab Orders (List) --
    if (data.labOrders && data.labOrders.length > 0) {
        if (yPosition > 240) { doc.addPage(); yPosition = 20; }
        addSectionTitle('Laboratory Orders');

        // Using autoTable for cleaner list
        const labBody = data.labOrders.map(lab => [`• ${lab}`]);
        autoTable(doc, {
            startY: yPosition,
            body: labBody,
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 1 },
            margin: { left: 25 }
        });
        yPosition = doc.lastAutoTable.finalY + 10;
    }

    // -- Footer --
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
        doc.text('Confidential - Generated by HealthScribe', 20, 285);

        // Footer Line
        doc.setDrawColor(200);
        doc.line(20, 280, 190, 280);
    }

    // Save
    const filename = `Note_${data.patientInfo?.name?.replace(/\s/g, '_') || 'Patient'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
}
