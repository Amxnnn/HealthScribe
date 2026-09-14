import { useId, useRef } from 'react';
import { Activity, Heart, Thermometer, Wind, Droplet } from 'lucide-react';
import { useRecordSection } from '../context/contexts.js';
import { stripUnit } from '../utils/units';

// Uncontrolled so the clinician can edit freely. The parent keys each input
// on its value, so a new reading from the model remounts the field instead
// of leaving a stale figure on screen.
const VitalInput = ({ icon: Icon, name, label, value, unit, placeholder, range }) => {
    const id = useId();
    // The model often bakes the unit into the value; the field shows its own
    const reading = stripUnit(value);

    return (
        <div className="form-group">
            <label className="label" htmlFor={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icon size={14} className="icon-muted" aria-hidden="true" />
                    {label}
                </span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                    {range}
                </span>
            </label>
            <div style={{ position: 'relative' }}>
                <input
                    id={id}
                    name={name}
                    type="text"
                    className={`input ${reading ? 'input-filled' : ''}`}
                    defaultValue={reading}
                    placeholder={placeholder}
                    style={{ paddingRight: '3.25rem' }}
                />
                <span
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                        fontSize: '0.75rem',
                        pointerEvents: 'none'
                    }}
                >
                    {unit}
                </span>
            </div>
        </div>
    );
};

const VitalSigns = ({ bp, heartRate, temp, respRate, o2Sat }) => {
    const fieldsRef = useRef(null);

    // Export the values on screen, including anything the clinician corrected
    useRecordSection('vitals', () => {
        const root = fieldsRef.current;
        if (!root) return null;
        return Object.fromEntries(
            [...root.querySelectorAll('input[name]')].map(el => [el.name, el.value.trim()])
        );
    });

    return (
        <div className="card">
            <div className="section-title">
                <Activity size={17} className="icon-muted" aria-hidden="true" />
                <span>Vital Signs</span>
            </div>

            <div className="grid-cols-2" ref={fieldsRef}>
                <VitalInput key={`bp-${bp}`} name="bp" icon={Activity} label="Blood pressure" value={bp} unit="mmHg" placeholder="120/80" range="90/60–120/80" />
                <VitalInput key={`hr-${heartRate}`} name="heartRate" icon={Heart} label="Heart rate" value={heartRate} unit="bpm" placeholder="72" range="60–100" />
                <VitalInput key={`temp-${temp}`} name="temp" icon={Thermometer} label="Temperature" value={temp} unit="°F" placeholder="98.6" range="97–99" />
                <VitalInput key={`rr-${respRate}`} name="respRate" icon={Wind} label="Respiratory rate" value={respRate} unit="/min" placeholder="16" range="12–20" />
                <VitalInput key={`o2-${o2Sat}`} name="o2Sat" icon={Droplet} label="O₂ saturation" value={o2Sat} unit="%" placeholder="98" range="> 95" />
            </div>
        </div>
    );
};

export default VitalSigns;
