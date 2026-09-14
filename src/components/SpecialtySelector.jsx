import { Stethoscope, Baby, Heart } from 'lucide-react';

const specialties = [
    { id: 'general', name: 'General', icon: Stethoscope, color: 'var(--accent-primary)', description: 'Primary care' },
    { id: 'pediatrics', name: 'Pediatrics', icon: Baby, color: '#ec4899', description: 'Child care' },
    { id: 'cardiology', name: 'Cardiology', icon: Heart, color: '#ef4444', description: 'Heart care' }
];

export default function SpecialtySelector({ onSpecialtyChange, currentSpecialty }) {
    return (
        <div className="specialty-selector" style={{ marginBottom: '1.25rem' }}>
            <h3 className="eyebrow" id="specialty-label">Specialty mode</h3>
            <div
                role="group"
                aria-labelledby="specialty-label"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem' }}
            >
                {specialties.map(specialty => {
                    const Icon = specialty.icon;
                    const isActive = currentSpecialty === specialty.id;
                    return (
                        <button
                            key={specialty.id}
                            type="button"
                            onClick={() => onSpecialtyChange(specialty.id)}
                            className="tile specialty-tile"
                            aria-pressed={isActive}
                            title={specialty.description}
                            style={{ '--tile-accent': specialty.color }}
                        >
                            <Icon
                                size={17}
                                aria-hidden="true"
                                style={{ color: isActive ? specialty.color : 'currentColor' }}
                            />
                            <span className="specialty-name">{specialty.name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
