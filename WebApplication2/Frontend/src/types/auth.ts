export interface EmailDto {
    email: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterCustomerDto {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface TokenResponseDto {
    token: string;
    refreshToken: string;
}

export interface RefreshTokenDto {
    refreshToken: string;
}

export interface ResetPasswordDto {
    token: string;
    newPassword: string;
}

export interface VerifyEmailDto {
    email: string;
    code: string;
}

export interface UserInfo {
    id: string;
    role: string;
    email?: string;
}