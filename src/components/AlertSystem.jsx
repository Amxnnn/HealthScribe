import { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ICONS = {
    critical: AlertTriangle,
    warning: AlertCircle,
    info: Info
};

const keyOf = (alert) => `${alert.severity}:${alert.title}`;

export default function AlertSystem({ alerts }) {
    const [dismissed, setDismissed] = useState([]);
    const [seen, setSeen] = useState(alerts);

    // A fresh set of alerts is a new clinical situation, so previously
    // dismissed warnings must come back. Adjusting during render is the
    // documented way to reset state from props without an extra pass.
    if (alerts !== seen) {
        setSeen(alerts);
        setDismissed([]);
    }

    if (!alerts || alerts.length === 0) return null;

    const visible = alerts.filter(a => !dismissed.includes(keyOf(a)));
    if (visible.length === 0) return null;

    return (
        <div className="alert-stack" role="alert" aria-live="assertive">
            {visible.map((alert) => {
                const severity = ICONS[alert.severity] ? alert.severity : 'info';
                const Icon = ICONS[severity];
                return (
                    <div key={keyOf(alert)} className={`alert alert-${severity}`}>
                        <Icon size={15} className="alert-icon" aria-hidden="true" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p className="alert-title">{alert.title}</p>
                            <p>{alert.message}</p>
                        </div>
                        <button
                            type="button"
                            className="alert-dismiss"
                            aria-label={`Dismiss ${alert.title}`}
                            onClick={() => setDismissed(prev => [...prev, keyOf(alert)])}
                        >
                            <X size={14} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
