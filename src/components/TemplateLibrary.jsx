const templates = [
    {
        id: 'annual-checkup',
        name: 'Annual Checkup',
        description: 'Routine preventive care visit',
        text: 'Patient for Annual physical. Reports feeling well. No acute concerns. Vitals within normal limits. Labs: order CBC, CMP, lipid panel. Continue current medications. Return in 1 year.'
    },
    {
        id: 'acute-uri',
        name: 'URI / Cold',
        description: 'Common cold/flu symptoms',
        text: 'Patient presents with cough, congestion, sore throat for 3 days. No fever. Lungs clear. Assessment: Viral URI. Plan: Symptomatic treatment, rest, fluids. Return if worsening.'
    },
    {
        id: 'hypertension',
        name: 'HTN Follow-up',
        description: 'Blood pressure management',
        text: 'Follow-up for hypertension. BP 135/85 today. Reports compliance with meds. No side effects. Continue current regimen. Lifestyle counseling provided. Recheck in 3 months.'
    },
    {
        id: 'diabetes',
        name: 'Diabetes Mgmt',
        description: 'Type 2 diabetes check',
        text: 'Diabetes follow-up. Blood sugars stable. HbA1c 7.2%. Feet exam normal. Continue metformin 1000mg BID. Order HbA1c, lipid panel.'
    }
];

export default function TemplateLibrary({ onTemplateSelect }) {
    return (
        <div className="template-library">
            <h3 className="eyebrow" id="templates-label">Quick templates</h3>
            <div
                role="group"
                aria-labelledby="templates-label"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.5rem' }}
            >
                {templates.map(template => (
                    <button
                        key={template.id}
                        type="button"
                        onClick={() => onTemplateSelect(template.text)}
                        className="tile template-tile"
                        title={template.description}
                    >
                        <span className="template-name">{template.name}</span>
                        <span className="template-desc">{template.description}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
