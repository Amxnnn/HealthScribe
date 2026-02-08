export default function TemplateLibrary({ onTemplateSelect }) {
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

    return (
        <div className="template-library" style={{ marginTop: '1rem' }}>
            <h3 className="text-xs font-semibold mb-2 uppercase text-gray-500">Quick Templates</h3>
            <div className="templates-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {templates.map(template => (
                    <button
                        key={template.id}
                        onClick={() => onTemplateSelect(template.text)}
                        className="template-card"
                        title={template.description}
                        style={{
                            textAlign: 'left',
                            padding: '0.5rem',
                            border: '1px solid var(--border-medium)',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-primary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontSize: '0.8rem'
                        }}
                    >
                        <span style={{ fontWeight: '500', display: 'block', marginBottom: '0.1rem' }}>{template.name}</span>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{template.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}
