import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const OAuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');

        if (token && refreshToken) {
            localStorage.setItem('accessToken', token);
            localStorage.setItem('refreshToken', refreshToken);
            navigate('/');
        } else {
            navigate('/login?error=oauth_failed');
        }
    }, [searchParams, navigate]);

    return <LoadingSpinner />;
};