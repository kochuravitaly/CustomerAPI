import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { profileService } from '../../services/profile.service';
import { SessionDto } from '../../types/profile';
import { useLanguage } from '../../context/LanguageContext';

interface ActiveSessionsProps {
    onError: (msg: string) => void;
}

export const ActiveSessions: React.FC<ActiveSessionsProps> = ({ onError }) => {
    const { t } = useLanguage();
    const [localSuccess, setLocalSuccess] = React.useState('');
    const [localError, setLocalError] = React.useState('');

    const { data: sessions, refetch: refetchSessions } = useQuery({
        queryKey: ['sessions'],
        queryFn: async () => (await profileService.getSessions()).data,
        retry: false,
    });

    const revokeSessionMutation = useMutation({
        mutationFn: (sessionId: number) => profileService.revokeSession(sessionId),
        onSuccess: () => {
            refetchSessions();
            setLocalSuccess(t.profile.sessionsRevoked);
            setTimeout(() => setLocalSuccess(''), 3000);
        },
        onError: (err: any) => {
            setLocalError(err.response?.data?.error || 'Failed to revoke session');
            onError(err.response?.data?.error || 'Failed to revoke session');
            setTimeout(() => setLocalError(''), 3000);
        },
    });

    return (
        <div className="profile-section">
            <h3>{t.profile.activeSessions}</h3>

            {localSuccess && (
                <div className="alert alert-success" style={{ marginBottom: '12px' }}>{localSuccess}</div>
            )}
            {localError && (
                <div className="alert alert-error" style={{ marginBottom: '12px' }}>{localError}</div>
            )}

            {sessions && sessions.length > 0 ? (
                sessions.map((session: SessionDto) => (
                    <div
                        key={session.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px',
                            border: session.isCurrentSession ? '2px solid #4CAF50' : '1px solid var(--border-color)',
                            borderRadius: '8px',
                            marginBottom: '8px',
                            background: session.isCurrentSession ? 'rgba(76, 175, 80, 0.08)' : 'var(--bg-primary)',
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>
                                {session.deviceInfo || 'Unknown device'}
                                {session.isCurrentSession && (
                                    <span style={{ color: '#4CAF50', fontSize: '12px', marginLeft: '8px' }}>
                                        ({t.profile.currentSession})
                                    </span>
                                )}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {session.ipAddress || 'Unknown IP'} • {new Date(session.lastActiveAt).toLocaleString()}
                            </div>
                        </div>
                        {!session.isCurrentSession && (
                            <button
                                type="button"
                                onClick={() => revokeSessionMutation.mutate(session.id)}
                                className="btn btn-danger btn-small"
                            >
                                {t.profile.revoke}
                            </button>
                        )}
                    </div>
                ))
            ) : (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {t.profile.noActiveSessions}
                </p>
            )}
        </div>
    );
};