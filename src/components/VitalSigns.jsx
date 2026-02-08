import React from 'react';
import { Activity, Heart, Thermometer, Wind, Droplet } from 'lucide-react';

const VitalInput = ({ icon: Icon, label, value, unit, placeholder, range }) => (
    <div className="form-group">
        <label className="label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon size={16} className="text-secondary" />
                {label}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                {range}
            </span>
        </label>
        <div style={{ position: 'relative' }}>
            <input
                type="text"
                className="input"
                defaultValue={value || ""}
                placeholder={value ? "" : "Not recorded"}
                style={{ paddingRight: '3rem', borderColor: value ? 'var(--accent-primary)' : 'var(--border-light)' }}
            />
            <span style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontSize: '0.875rem'
            }}>
                {unit}
            </span>
        </div>
    </div>
);

const VitalSigns = ({ bp, heartRate, temp, respRate, o2Sat }) => {
    return (
        <div className="card" style={{ animation: 'slideIn 0.3s ease' }}>
            <div className="section-title">
                <Activity size={20} className="text-secondary" />
                <span>Vital Signs</span>
            </div>

            <div className="grid-cols-2">
                <VitalInput
                    icon={Activity}
                    label="Blood Pressure"
                    value={bp}
                    unit="mmHg"
                    placeholder="120/80"
                    range="90/60 - 120/80"
                />
                <VitalInput
                    icon={Heart}
                    label="Heart Rate"
                    value={heartRate}
                    unit="bpm"
                    placeholder="72"
                    range="60 - 100"
                />
                <VitalInput
                    icon={Thermometer}
                    label="Temperature"
                    value={temp}
                    unit="°F"
                    placeholder="98.6"
                    range="97 - 99"
                />
                <VitalInput
                    icon={Wind}
                    label="Respiratory Rate"
                    value={respRate}
                    unit="bpm"
                    placeholder="16"
                    range="12 - 20"
                />
                <VitalInput
                    icon={Droplet}
                    label="O2 Saturation"
                    value={o2Sat}
                    unit="%"
                    placeholder="98"
                    range="> 95%"
                />
            </div>
        </div>
    );
};

export default VitalSigns;
