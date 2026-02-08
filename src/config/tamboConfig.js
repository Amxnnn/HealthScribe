import { z } from 'zod';
import PatientCard from '../components/PatientCard';
import VitalSigns from '../components/VitalSigns';
import SoapNotes from '../components/SoapNotes';
import PrescriptionForm from '../components/PrescriptionForm';
import LabOrderForm from '../components/LabOrderForm';
import ClinicalInsights from '../components/ClinicalInsights';

export const tamboConfig = [
    {
        name: "ClinicalInsights",
        component: ClinicalInsights,
        description: "Display proactive AI suggestions, risk assessments, and medical billing codes.",
        propsSchema: z.object({
            suggestions: z.array(z.string()).optional().describe("List of recommended next steps or referrals."),
            riskAssessment: z.string().optional().describe("Warnings about drug interactions, allergies, or critical values."),
            billingCodes: z.object({
                icd10: z.array(z.string()).optional().describe("Relevant ICD-10 diagnosis codes (e.g. I10)"),
                rxNorm: z.array(z.string()).optional().describe("Relevant RxNorm medication codes")
            }).optional().describe("Medical billing codes.")
        })
    },
    {
        name: "PatientCard",
        component: PatientCard,
        description: "Display patient demographic information. Use this component when the doctor mentions patient details like name, age, gender, or chief complaint. This should typically be the first component shown when starting a new patient documentation.",
        propsSchema: z.object({
            name: z.string().optional().describe("Patient's full name. Extract from phrases like 'patient [name]', 'name is [name]', or context."),
            age: z.number().optional().describe("Patient's age in years."),
            gender: z.string().optional().describe("Patient's gender (Male/Female/Other)."),
            complaint: z.string().optional().describe("Chief complaint or reason for visit.")
        })
    },
    {
        name: "VitalSigns",
        component: VitalSigns,
        description: "Display vital sign measurements. Use when doctor mentions blood pressure, heart rate, temperature, respiratory rate, or oxygen saturation. Common in physical examination.",
        propsSchema: z.object({
            bp: z.string().optional().describe("Blood pressure in format XXX/XX (e.g., 120/80)."),
            heartRate: z.string().optional().describe("Heart rate in beats per minute."),
            temp: z.string().optional().describe("Temperature with unit (F or C)."),
            respRate: z.string().optional().describe("Respiratory rate (breaths per minute)."),
            o2Sat: z.string().optional().describe("Oxygen saturation as percentage.")
        })
    },
    {
        name: "SoapNotes",
        component: SoapNotes,
        description: "Medical SOAP note documentation. Use for comprehensive visit documentation with Subjective, Objective, Assessment, and Plan sections.",
        propsSchema: z.object({
            subjective: z.string().optional().describe("Patient's reported symptoms, history, and complaints."),
            objective: z.string().optional().describe("Physical exam findings, vital signs observations, test results."),
            assessment: z.string().optional().describe("Medical diagnosis or clinical impression."),
            plan: z.string().optional().describe("Treatment plan, prescriptions, follow-up instructions.")
        })
    },
    {
        name: "PrescriptionForm",
        component: PrescriptionForm,
        description: "Medication prescription form. Use when doctor mentions prescribing medications, starting treatment, or medication orders.",
        propsSchema: z.object({
            medication: z.string().optional().describe("Medication name."),
            dosage: z.string().optional().describe("Dose amount with unit (e.g., 500mg)."),
            frequency: z.string().optional().describe("How often (e.g., 'twice daily')."),
            duration: z.string().optional().describe("Treatment duration (e.g., '10 days')."),
            instructions: z.string().optional().describe("Special instructions.")
        })
    },
    {
        name: "LabOrderForm",
        component: LabOrderForm,
        description: "Laboratory test order form. Use when doctor mentions ordering lab tests, blood work, or diagnostic tests.",
        propsSchema: z.object({
            selectedLabs: z.array(z.string()).optional().describe("Array of lab test names to order (e.g. CBC, CMP, Lipid Panel, HbA1c, TSH).")
        })
    }
];
