import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/auth.service';
import { accountService } from '../services/account.service';
import { LoginDto, RegisterCustomerDto, UserInfo } from '../types/auth';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
    user: UserInfo | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (data: LoginDto) => Promise<any>;
    verify2FA: (customerId: string, code: string) => Promise<void>;
    register: (data: RegisterCustomerDto) => Promise<void>;
    logout: () => Promise<void>;
    switchAccount: (accountId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);

    const decodeToken = (token: string): UserInfo | null => {
        try {
            const decoded: any = jwtDecode(token);
            const role = decoded.role ||
                decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
                'Customer';
            const id = decoded.nameid ||
                decoded.sub ||
                decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

            if (!id) return null;

            return {
                id: id,
                role: role,
                email: decoded.email,
            };
        } catch {
            return null;
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            const decodedUser = decodeToken(token);
            if (decodedUser) {
                setUser(decodedUser);
            } else {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
            }
        }
        setLoading(false);
    }, []);

    const login = async (data: LoginDto) => {
        const response = await authService.login(data);
        const { token, refreshToken, requiresTwoFactor, customerId, twoFactorMethod } = response.data;

        if (requiresTwoFactor) {
            return { requiresTwoFactor: true, customerId, twoFactorMethod };
        }

        if (!token || !refreshToken) {
            throw new Error('Invalid response');
        }

        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', refreshToken);

        const decodedUser = decodeToken(token);
        if (decodedUser) {
            setUser(decodedUser);
        }

        return { requiresTwoFactor: false };
    };

    const verify2FA = async (customerId: string, code: string) => {
        const response = await authService.verify2FA({ customerId, code });
        const { token, refreshToken } = response.data;

        if (!token || !refreshToken) {
            throw new Error('Invalid response');
        }

        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', refreshToken);

        const decodedUser = decodeToken(token);
        if (decodedUser) {
            setUser(decodedUser);
        }
    };

    const switchAccount = async (accountId: string) => {
        const response = await accountService.switchAccount(accountId);
        const { token, refreshToken } = response.data;

        if (!token || !refreshToken) {
            throw new Error('Invalid response');
        }

        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', refreshToken);

        const decodedUser = decodeToken(token);
        if (decodedUser) {
            setUser(decodedUser);
        }
    };

    const register = async (data: RegisterCustomerDto) => {
        await authService.register(data);
    };

    const logout = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await authService.logout({ refreshToken });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
            window.location.href = '/login';
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'Admin',
        login,
        verify2FA,
        register,
        logout,
        switchAccount,
    };

    if (loading) {
        return <div className="loading-screen">Loading...</div>;
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within AuthContext');
    }
    return context;
};