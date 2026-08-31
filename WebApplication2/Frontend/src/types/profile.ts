export interface ProfileDto {
    id: string;
    name: string;
    email: string;
    role: string;
    isEmailConfirmed: boolean;
    createdAt: string;
    hasProfilePicture: boolean;
}

export interface UpdateProfileDto {
    name: string;
}

export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}

export interface ChangeEmailDto {
    newEmail: string;
    language?: string;
}

export interface VerifyEmailChangeDto {
    newEmail: string;
    code: string;
}

export interface DeleteAccountDto {
    password: string;
}

export interface ProfileAccountDto {
    id: string;
    name: string;
    email: string;
    role: string;
    hasProfilePicture: boolean;
}

export interface AddAccountDto {
    email: string;
    password: string;
}

export interface TwoFactorSetupDto {
    secretKey: string;
    qrCodeUri: string;
}

export interface TwoFactorVerifyDto {
    code: string;
}

export interface SessionDto {
    id: number;
    deviceInfo: string;
    ipAddress: string;
    createdAt: string;
    lastActiveAt: string;
    isCurrentSession: boolean;
}