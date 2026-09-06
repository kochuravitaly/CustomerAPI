import React, { useState, useEffect } from 'react';
import '../styles/components/access-gate.css';

const ACCESS_CODE = 'cs2026';
const ACCESS_KEY = 'access_granted';

export const AccessGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isGranted, setIsGranted] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const granted = localStorage.getItem(ACCESS_KEY);
        if (granted === 'true') {
            setIsGranted(true);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (code === ACCESS_CODE) {
            localStorage.setItem(ACCESS_KEY, 'true');
            setIsGranted(true);
            setError('');
        } else {
            setError('Invalid code');
            setCode('');
        }
    };

    if (isGranted) {
        return <>{children}</>;
    }

    return (
        <div className="access-gate">
            <div className="access-gate-card">
                <div className="access-gate-icon">🔒</div>
                <h1>Private Site</h1>
                <p className="access-gate-subtitle">
                    Testing in progress. Unauthorized access is prohibited.
                </p>

                <form onSubmit={handleSubmit} className="access-gate-form">
                    <input
                        type="password"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Enter access code"
                        className="access-gate-input"
                        autoFocus
                    />
                    {error && <div className="access-gate-error">{error}</div>}
                    <button type="submit" className="access-gate-btn">
                        Enter
                    </button>
                </form>
            </div>
        </div>
    );
};