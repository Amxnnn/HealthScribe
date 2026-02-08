import { Stethoscope, Baby, Heart } from 'lucide-react';

export default function SpecialtySelector({ onSpecialtyChange, currentSpecialty }) {
    const specialties = [
        {
            id: 'general',
            name: 'General',
            icon: Stethoscope,
            color: 'var(--accent-primary)',
            description: 'Primary care'
        },
        {
            id: 'pediatrics',
            name: 'Pediatrics',
            icon: Baby,
            color: '#ec4899', // Pink
            description: 'Child care'
        },
        {
            id: 'cardiology',
            name: 'Cardiology',
            icon: Heart,
            color: '#ef4444', // Red
            description: 'Heart care'
        }
    ];

    return (
        <div className="specialty-selector" style={{ marginBottom: '1.5rem' }}>
            <h3 className="text-xs font-semibold mb-2 uppercase text-gray-500">Specialty Mode</h3>
            <div className="specialty-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                {specialties.map(specialty => {
                    const Icon = specialty.icon;
                    const isActive = currentSpecialty === specialty.id;
                    return (
                        <button
                            key={specialty.id}
                            onClick={() => onSpecialtyChange(specialty.id)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '0.75rem 0.25rem',
                                border: isActive ? `2px solid ${specialty.color}` : '1px solid var(--border-medium)',
                                borderRadius: 'var(--radius-md)',
                                background: isActive ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                gap: '0.25rem'
                            }}
                            title={specialty.description}
                        >
                            <Icon size={20} style={{ color: isActive ? specialty.color : 'inherit' }} />
                            <span style={{ fontSize: '0.7rem', fontWeight: '500' }}>{specialty.name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
