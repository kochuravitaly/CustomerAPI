export interface EmailDto {
    email: string;
    language?: string;
}

export interface LoginDto {
    email: string;
    password: string;
    language?: string;
    rememberMe?: boolean;
}

export interface RegisterCustomerDto {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    language?: string;
    privacy?: boolean;
}

export interface TokenResponseDto {
    token?: string;
    refreshToken?: string;
    requiresTwoFactor?: boolean;
    customerId?: string;
    twoFactorMethod?: string;
}

export interface RefreshTokenDto {
    refreshToken: string;
}

export interface ResetPasswordDto {
    token: string;
    newPassword: string;
    confirmPassword?: string;
}

export interface VerifyEmailDto {
    email: string;
    code: string;
}

export interface Verify2FADto {
    customerId: string;
    code: string;
}

export interface UserInfo {
    id: string;
    role: string;
    email?: string;
}