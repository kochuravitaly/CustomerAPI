import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/auth.service';
import { LoginDto, RegisterCustomerDto, UserInfo } from '../types/auth';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
    user: UserInfo | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (data: LoginDto) => Promise<void>;
    register: (data: RegisterCustomerDto) => Promise<void>;
    logout: () => Promise<void>;
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
        const { token, refreshToken } = response.data;
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
        register,
        logout,
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