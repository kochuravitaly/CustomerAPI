import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const OAuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');

        if (token && refreshToken) {
            localStorage.setItem('accessToken', token);
            localStorage.setItem('refreshToken', refreshToken);
            window.location.href = '/';
        } else {
            window.location.href = '/login?error=oauth_failed';
        }
    }, [searchParams]);

    return <LoadingSpinner />;
};