import { BarChart2, Zap, Clock } from 'lucide-react';

export default function StatsBar({ stats }) {
    const items = [
        { icon: BarChart2, label: 'Records', value: stats.componentCount },
        { icon: Zap, label: 'AI calls', value: stats.aiCalls },
        { icon: Clock, label: 'Time saved', value: `~${stats.componentCount * 2} min` }
    ];

    return (
        <div className="stats-bar">
            {items.map(({ icon: Icon, label, value }) => (
                <div className="stat-item" key={label}>
                    <Icon size={13} className="icon-muted" aria-hidden="true" />
                    <span className="stat-label">{label}</span>
                    <span className="stat-value">{value}</span>
                </div>
            ))}
        </div>
    );
}
