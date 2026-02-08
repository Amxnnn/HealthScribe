import { BarChart2, Zap, Clock } from 'lucide-react';

export default function StatsBar({ stats }) {
    return (
        <div className="stats-bar" style={{
            display: 'flex',
            gap: '1.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            alignItems: 'center',
            border: '1px solid var(--border-light)'
        }}>
            <div className="stat-item" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BarChart2 size={14} />
                <span className="stat-label">Components:</span>
                <span className="stat-value" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stats.componentCount}</span>
            </div>
            <div className="stat-item" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Zap size={14} />
                <span className="stat-label">AI Calls:</span>
                <span className="stat-value" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stats.aiCalls}</span>
            </div>
            <div className="stat-item" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={14} />
                <span className="stat-label">Time Saved:</span>
                <span className="stat-value" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>~{stats.componentCount * 2} min</span>
            </div>
        </div>
    );
}
