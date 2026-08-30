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