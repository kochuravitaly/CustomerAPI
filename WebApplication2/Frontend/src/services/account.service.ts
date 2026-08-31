import { apiService } from './api';
import { ProfileAccountDto, AddAccountDto } from '../types/profile';
import { TokenResponseDto } from '../types/auth';

export const accountService = {
    getAccounts: () =>
        apiService.get<ProfileAccountDto[]>('/profile/accounts'),

    addAccount: (data: AddAccountDto) =>
        apiService.post('/profile/accounts', data),

    removeAccount: (accountId: string) =>
        apiService.delete(`/profile/accounts/${accountId}`),

    switchAccount: (accountId: string) =>
        apiService.post<TokenResponseDto>(`/profile/switch-account/${accountId}`),
};