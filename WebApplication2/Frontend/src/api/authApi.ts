import { apiRequest } from "./client";

export interface RegisterCustomerRequest {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface VerifyEmailRequest {
    email: string;
    code: string;
}

export interface EmailRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface TokenResponse {
    token: string;
    refreshToken: string;
}

export interface ForgotPasswordResponse {
    message: string;
    token: string;
}

export async function register(
    request: RegisterCustomerRequest
): Promise<void> {
    await apiRequest<void>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(request),
    });
}

export async function login(
    request: LoginRequest
): Promise<TokenResponse> {
    return apiRequest<TokenResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(request),
    });
}

export async function verifyEmail(
    request: VerifyEmailRequest
): Promise<void> {
    await apiRequest<void>("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify(request),
    });
}

export async function resendVerification(
    request: EmailRequest
): Promise<void> {
    await apiRequest<void>("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify(request),
    });
}

export async function forgotPassword(
    request: EmailRequest
): Promise<ForgotPasswordResponse> {
    return apiRequest<ForgotPasswordResponse>(
        "/api/auth/forgot-password",
        {
            method: "POST",
            body: JSON.stringify(request),
        }
    );
}

export async function resetPassword(
    request: ResetPasswordRequest
): Promise<void> {
    await apiRequest<void>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(request),
    });
}

export async function refreshToken(
    request: RefreshTokenRequest
): Promise<TokenResponse> {
    return apiRequest<TokenResponse>("/api/auth/refresh", {
        method: "POST",
        body: JSON.stringify(request),
    });
}

export async function logout(
    refreshToken: string
): Promise<void> {
    await apiRequest<void>("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({
            refreshToken,
        }),
    });
}