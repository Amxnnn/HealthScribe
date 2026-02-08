/**
 * Parses natural language medical notes into structured data.
 * @param {string} text - The raw doctor's notes.
 * @returns {object} Structured data object.
 */
export const parseMedicalNotes = (text) => {
    if (!text) return null;

    const result = {
        patientInfo: {},
        vitals: {},
        prescription: {},
        labOrders: [],
        soap: {
            subjective: text, // Default to full text if not parsed sections
            objective: "",
            assessment: "",
            plan: ""
        }
    };

    // 1. PATIENT INFO
    const nameMatch = text.match(/(?:patient|pt|name is)\s+([a-zA-Z\s]+?)(?:,|\.|versus|\d)/i) || text.match(/^([a-zA-Z\s]+?)(?:,)/);
    if (nameMatch) result.patientInfo.name = nameMatch[1].trim();

    const ageMatch = text.match(/(\d+)\s*(?:yo|y\/o|years old|years)/i);
    if (ageMatch) result.patientInfo.age = parseInt(ageMatch[1]);

    const genderMatch = text.match(/\b(male|female|man|woman|boy|girl|[MF])\b/i);
    if (genderMatch) {
        const g = genderMatch[1].toLowerCase();
        result.patientInfo.gender = (g === 'm' || g === 'man' || g === 'boy') ? 'male' : 'female';
    }

    const complaintMatch = text.match(/(?:c\/o|complains of|presenting with|came in for)\s+(.+?)(?:\.|$)/i);
    if (complaintMatch) result.patientInfo.complaint = complaintMatch[1].trim();


    // 2. VITALS
    const bpMatch = text.match(/BP\s*:?\s*(\d{2,3}\/\d{2,3})/i) || text.match(/(\d{2,3}\/\d{2,3})/);
    if (bpMatch) result.vitals.bp = bpMatch[1];

    const hrMatch = text.match(/(?:HR|heart rate|pulse)\s*:?\s*(\d{2,3})/i);
    if (hrMatch) result.vitals.heartRate = hrMatch[1];

    const tempMatch = text.match(/(?:Temp|Temperature)\s*:?\s*(\d{2,3}(?:\.\d)?)/i);
    if (tempMatch) result.vitals.temp = tempMatch[1];

    const respMatch = text.match(/(?:RR|Resp|respiratory rate)\s*:?\s*(\d{1,2})/i);
    if (respMatch) result.vitals.respRate = respMatch[1];

    const o2Match = text.match(/(?:O2|O2 sat|SpO2)\s*:?\s*(\d{2,3}%?)/i);
    if (o2Match) result.vitals.o2Sat = o2Match[1].replace('%', '');


    // 3. MEDICATIONS
    // Look for patterns like "Prescribe [Drug] [Dose] [Freq]"
    const rxMatch = text.match(/(?:prescribe|start|medication|rx)\s+([a-zA-Z]+)\s+(\d+(?:mg|g|ml|mcg))\s+(.+?)(?:\.|$)/i);
    if (rxMatch) {
        result.prescription = {
            medication: rxMatch[1],
            dosage: rxMatch[2],
            frequency: rxMatch[3].trim(),
            duration: "7 days", // default
            instructions: "Take as directed"
        };
    }

    // 4. LAB ORDERS
    // Look for common labs in text
    const commonLabs = ["CBC", "CMP", "Lipid Panel", "HbA1c", "Urinalysis", "TSH", "Vitamin D", "Iron Panel", "Coagulation"];
    commonLabs.forEach(lab => {
        if (new RegExp(lab, 'i').test(text)) {
            result.labOrders.push(lab);
        }
    });

    // 5. SOAP SECTIONS (Simple Logic)
    // If explicitly labeled sections exist
    const subjMatch = text.match(/Subjective:\s*(.+?)(?:Objective:|Assessment:|Plan:|$)/is);
    if (subjMatch) result.soap.subjective = subjMatch[1].trim();

    const objMatch = text.match(/Objective:\s*(.+?)(?:Assessment:|Plan:|$)/is);
    if (objMatch) result.soap.objective = objMatch[1].trim();
    else if (Object.keys(result.vitals).length > 0) {
        // Auto-construct objective from vitals if not explicit
        result.soap.objective = `Vitals: BP ${result.vitals.bp || 'N/A'}, HR ${result.vitals.heartRate || 'N/A'}, Temp ${result.vitals.temp || 'N/A'}`;
    }

    const assessMatch = text.match(/(?:Assessment|Impression):\s*(.+?)(?:Plan:|$)/is);
    if (assessMatch) result.soap.assessment = assessMatch[1].trim();
    else if (result.patientInfo.complaint) {
        result.soap.assessment = `Evaluation for ${result.patientInfo.complaint}`;
    }

    const planMatch = text.match(/Plan:\s*(.+?)$/is) || text.match(/(?:prescribe|order|refer)\s+.+/i);
    if (planMatch) result.soap.plan = planMatch[0].trim();


    return result;
};
