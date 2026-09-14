import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Contains a render failure to a single card.
 *
 * The workspace renders components chosen and populated by the model, so a
 * malformed payload is a realistic runtime case. Without a boundary one bad
 * card takes down the whole session, losing the clinician's documentation.
 */
export default class ErrorBoundary extends Component {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error, info) {
        console.error('Card failed to render:', error, info);
    }

    render() {
        if (!this.state.failed) return this.props.children;

        return (
            <div className="card" role="alert">
                <div className="alert alert-warning" style={{ animation: 'none' }}>
                    <AlertTriangle size={15} className="alert-icon" aria-hidden="true" />
                    <div>
                        <p className="alert-title">This card could not be displayed</p>
                        <p>
                            The rest of your documentation is unaffected. Re-processing the
                            note usually resolves it.
                        </p>
                    </div>
                </div>
            </div>
        );
    }
}
