import axios from 'axios';
import { TokenResponseDto } from '../types/auth';

const API_URL = (import.meta as any).env?.VITE_API_URL || '';

class ApiService {
    private api = axios.create({
        baseURL: `${API_URL}/api`,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    constructor() {
        // Add token to requests
        this.api.interceptors.request.use((config) => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // Handle token refresh
        this.api.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const refreshToken = localStorage.getItem('refreshToken');
                        if (!refreshToken) throw new Error('No refresh token');

                        const response = await axios.post<TokenResponseDto>(
                            `${API_URL}/api/auth/refresh`,
                            { refreshToken }
                        );

                        const { token, refreshToken: newRefreshToken } = response.data;
                        localStorage.setItem('accessToken', token);
                        localStorage.setItem('refreshToken', newRefreshToken);

                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return this.api(originalRequest);
                    } catch (refreshError) {
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                        window.location.href = '/login';
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    get<T>(url: string, config?: any) {
        return this.api.get<T>(url, config);
    }

    post<T>(url: string, data?: any, config?: any) {
        return this.api.post<T>(url, data, config);
    }

    patch<T>(url: string, data?: any, config?: any) {
        return this.api.patch<T>(url, data, config);
    }

    put<T>(url: string, data?: any, config?: any) {
        return this.api.put<T>(url, data, config);
    }

    delete<T>(url: string, config?: any) {
        return this.api.delete<T>(url, config);
    }
}

export const apiService = new ApiService();