import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function AlertSystem({ alerts }) {
    if (!alerts || alerts.length === 0) return null;

    const getAlertStyle = (severity) => {
        const styles = {
            critical: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
            warning: { bg: '#fefce8', border: '#eab308', text: '#854d0e' },
            info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' }
        };
        return styles[severity] || styles.info;
    };

    const getAlertIcon = (severity) => {
        if (severity === 'critical') return <AlertTriangle size={16} />;
        if (severity === 'warning') return <AlertCircle size={16} />;
        return <Info size={16} />;
    };

    return (
        <div className="alerts-container" style={{ margin: '0 1.5rem 1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', animation: 'slideIn 0.3s' }}>
            {alerts.map((alert, index) => {
                const style = getAlertStyle(alert.severity);
                return (
                    <div
                        key={index}
                        style={{
                            backgroundColor: style.bg,
                            borderLeft: `4px solid ${style.border}`,
                            color: style.text,
                            padding: '0.75rem',
                            borderRadius: '4px',
                            fontSize: '0.85rem'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                            <div style={{ marginTop: '2px' }}>{getAlertIcon(alert.severity)}</div>
                            <div>
                                <p style={{ fontWeight: '600', marginBottom: '0.1rem' }}>{alert.title}</p>
                                <p>{alert.message}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
